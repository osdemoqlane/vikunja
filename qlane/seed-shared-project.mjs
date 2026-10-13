// Seeds the fixture for the read-only sharing check (see compose.qlane.yaml):
// a project owned by qa-owner, holding two tasks, shared with qa-member at the
// read-only permission. One tester signed in as qa-member can then check that
// the project is visible but cannot be edited.
//
// It runs once Vikunja is healthy, through Vikunja's own API. Every step looks
// for what an earlier run made before making it, so a re-run changes nothing.
// It stops at the first error and ends by reading the fixture back.
const { VIKUNJA_URL, QA_OWNER_PASSWORD, QA_MEMBER_PASSWORD } = process.env;
const api = `${VIKUNJA_URL}/api/v1`;

const TITLE = 'Shared read-only with QA member';
const TASKS = ['Read-only task one', 'Read-only task two'];
const MEMBER = 'qa-member';
const READ_ONLY = 0; // Vikunja's permission values: 0 read only, 1 read & write, 2 admin

async function call(method, path, token, body) {
	const response = await fetch(`${api}${path}`, {
		method,
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	if (!response.ok) {
		console.error(`${method} ${path} failed with HTTP ${response.status}: ${await response.text()}`);
		process.exit(1);
	}
	return response.json();
}

async function login(username, password) {
	const { token } = await call('POST', '/login', null, { username, password });
	return token;
}

const owner = await login('qa-owner', QA_OWNER_PASSWORD);

let project = (await call('GET', `/projects?s=${encodeURIComponent(TITLE)}`, owner)).find(
	(p) => p.title === TITLE,
);
if (project) {
	console.log(`The project "${TITLE}" already exists.`);
} else {
	project = await call('PUT', '/projects', owner, { title: TITLE });
	console.log(`Created the project "${TITLE}".`);
}

const existingTasks = await call('GET', `/projects/${project.id}/tasks`, owner);
for (const title of TASKS) {
	if (existingTasks.some((t) => t.title === title)) continue;
	await call('PUT', `/projects/${project.id}/tasks`, owner, { title });
	console.log(`Created the task "${title}".`);
}

const share = (await call('GET', `/projects/${project.id}/users`, owner)).find(
	(u) => u.username === MEMBER,
);
if (!share) {
	await call('PUT', `/projects/${project.id}/users`, owner, {
		username: MEMBER,
		permission: READ_ONLY,
	});
	console.log(`Shared the project with ${MEMBER}, read only.`);
} else if (share.permission !== READ_ONLY) {
	await call('POST', `/projects/${project.id}/users/${MEMBER}`, owner, { permission: READ_ONLY });
	console.log(`Set ${MEMBER}'s share back to read only.`);
} else {
	console.log(`The project is already shared with ${MEMBER}, read only.`);
}

// Read the fixture back, from both sides.
const tasks = await call('GET', `/projects/${project.id}/tasks`, owner);
const shares = await call('GET', `/projects/${project.id}/users`, owner);
const member = await login(MEMBER, QA_MEMBER_PASSWORD);
const seen = await call('GET', `/projects/${project.id}`, member);
const memberShare = shares.find((u) => u.username === MEMBER);
if (
	TASKS.some((title) => !tasks.some((t) => t.title === title)) ||
	memberShare?.permission !== READ_ONLY ||
	seen.title !== TITLE
) {
	console.error('The fixture did not read back as seeded.', {
		tasks: tasks.map((t) => t.title),
		shares: shares.map((u) => [u.username, u.permission]),
		memberSees: seen.title,
	});
	process.exit(1);
}
console.log(
	`Fixture ready: project ${project.id} has ${tasks.length} tasks, and ${MEMBER} sees it read only.`,
);
