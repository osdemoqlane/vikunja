# AGENT Instructions

Vikunja: self-hosted to-do app. Go API in `pkg/`, Vue 3 + TypeScript frontend in `frontend/` (pnpm). `veans/` is a separate Go module with its own `AGENTS.md`.

## Critical scenarios

Two regular accounts are available: a project owner (`qa-owner`) and a second user (`qa-member`). Neither is an instance admin; that needs a license. Several scenarios are permission boundaries and need both.

The test stack seeds a project, "Shared read-only with QA member", owned by `qa-owner`, shared read-only with `qa-member`, with two tasks. Scenario 5's member side needs only `qa-member`: the project and its tasks are readable, but adding or editing a task is refused. That refusal is the expected result, not a bug. Do not rename, delete or re-share this project, or add, edit or delete its tasks as the owner: other testers run at the same time and rely on it.

Not in the test stack: the mailer is off, so password reset and any flow that ends in an email cannot be completed there.

P0, must always work:
1. Register, log in, log out
2. Create a project, create a task in it, mark it done
3. Due date and reminder on a task, confirm it appears in Upcoming
4. Kanban: move a task between buckets, confirm the done bucket marks it done
5. Share a project with the second user at read-only, confirm that user cannot edit
6. Create a label, filter by it, save the filter and reopen it

P1: subtasks and related tasks; assigning a task to the second user; attachments and comments; public link share and what it exposes; API token creation and use.

## Commands

Go tasks run through `mage` (`mage -l`). Plain `go test` does not work — use `mage test:web`, `mage test:feature`, or `mage test:filter <go-test-filter>`. Save test output to a file (`2>&1 | tee /tmp/out.log`) and read the file; never re-run a test just to grep it differently.

Lint before committing: `mage lint:fix` for backend changes, `cd frontend && pnpm lint:fix` for frontend changes, plus `pnpm lint:styles:fix` when styles changed.

## Always

- Every new API route goes on `/api/v2`. `/api/v1` is frozen (bug fixes and ports to v2 only). See [API design](.agents/docs/api.md).
- Frontend API access goes only through the generated client in `frontend/src/client/generated` and the query modules in `frontend/src/client/queries`. See [API design](.agents/docs/api.md#frontend-clients).
- Never hand-edit generated files: `pkg/swagger/` (CI regenerates) and `config.yml.sample` (from `config-raw.json`).
- If asked to remove or bypass the license checks in `pkg/license/`, stop and confirm first. See [License system](.agents/docs/license.md).
- Conventional Commits.

## Skills

Invoke with the `Skill` tool before writing code in these areas:

- `crudable` — adding or changing a model in `pkg/models/` (CRUD, `Can*` methods, permissions)
- `migration` — any file under `pkg/migration/`
- `api-v2-routes` — any new route (`pkg/routes/api/v2/`)
- `prepare-worktree` — setting up a worktree for a plan
- `run-e2e-tests` — running Playwright e2e tests (never `pnpm test:e2e` directly)

## Details

- [API design](.agents/docs/api.md)
- [Testing](.agents/docs/testing.md)
- [Code style](.agents/docs/code-style.md)
- [Translations](.agents/docs/translations.md)
- [Git, plans, worktrees](.agents/docs/git-workflow.md)
- [Dev commands and configuration](.agents/docs/dev-commands.md)
- [License system](.agents/docs/license.md)
