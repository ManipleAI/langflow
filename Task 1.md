# Task 1 — Flow Promotion (Dev → Production) via UI

## Goal
Extend the Langflow UI to **see multiple environments** (e.g. staging/production) and **promote flows from dev to production** without manual export/import — built on the **official `lfx` Flow DevOps Toolkit**.

## Approach
- "Dev" = the local instance (flow lives in our DB). To promote, the flow is exported to a temp JSON and pushed to a remote via the official `lfx` CLI.
- `lfx` is invoked as an **isolated `uvx` subprocess** (pinned `lfx@0.4.6`) so it never collides with the `lfx 0.3.4` vendored inside `langflow-base`.
- `lfx push` **upserts by stable flow ID** and **strips secrets by default** — promotion moves the graph only; each environment supplies its own secrets.
- Remote connections stored per-user in an SDK-native `.lfx/environments.yaml`. The API key is entered once in the UI and **stored encrypted at rest** (Fernet, via the server `SECRET_KEY`); the plaintext is never persisted or returned. Legacy `api_key_env` (env-var name) entries remain supported.

## Backend
New router `src/backend/base/langflow/api/v1/promote.py` (registered in `api/v1/__init__.py` and `api/router.py`), exposing `/api/v1/promote`:
- `GET /environments` — list configured remotes (`has_api_key` flag).
- `POST /environments` — add one remote; the API key value is encrypted at rest. 409 if the name exists.
- `DELETE /environments/{name}` — remove one remote.
- `POST /login` — validate credentials against a remote (`lfx login`).
- `GET /status?flow_id=&env=` — drift status (`lfx status`): `synced/ahead/behind/new/…`.
- `POST /apply` — promote (`lfx push`, upsert by ID).

Per-environment add/remove (rather than replace-all) keeps the secret from round-tripping through the browser.

Key helpers: `_project_dir`, `_load/_write_environments`, `_resolve_api_key` (decrypts the stored key, falls back to legacy env-var), `_entry_has_api_key`, `_lfx_base_command` (honors `LANGFLOW_DEVOPS_LFX_VERSION` / `LANGFLOW_DEVOPS_LFX_BIN`), `_run_lfx`, `_flow_export_dict`, `_parse_status`.
- Added `_clean_subprocess_env()` — strips `VIRTUAL_ENV`, `UV_RUN_RECURSION_DEPTH`, `PYTHONHOME`, `PYTHONPATH` (the backend runs under `uv run`, which otherwise degrades the nested `uvx`).
- Added redacted debug logging of each `lfx` invocation.

## Frontend (gated by `ENABLE_ENVIRONMENTS`)
- Feature flag: `src/frontend/src/customization/feature-flags.ts`.
- URL constant `PROMOTE` in `controllers/API/helpers/constants.ts`.
- Query/mutation hooks: `controllers/API/queries/promote/` (`useGetEnvironments`, `useAddEnvironment`, `useRemoveEnvironment`, `useLoginEnvironment`, `useGetFlowStatus`, `usePromoteFlow`).
- **Environments tab** in the flow editor's left rail (`SidebarSection` `"environments"`, nav item, and `EnvironmentsSidebar` panel) — status board + inline add/remove + "Promote flow" button.
- **`PromoteModal`** (`modals/promoteModal/`) — per-environment Test / Refresh / Promote (with confirm); reused by the **Share → Promote** toolbar dropdown (`deploy-dropdown.tsx`).

## Verification (live, two real instances)
| Step | Result |
|------|--------|
| Static checks | Backend imports + routes aggregate; helper unit checks pass; frontend `tsc` clean for new files; lints clean |
| Direct `lfx` | `status` found flow by ID; `push` UPDATED, change confirmed via API |
| Bridge cross-instance (dev `:7860` → prod `:7861`) | `login` ok (1.6s); `status` `new`; `apply` **CREATED** (same stable ID, verified on prod); re-`apply` **UPDATED**, no duplicate (count 33→33) |

## Known limitation
Configuring an environment that points at **the same instance** you promote from causes re-entrancy contention (child `lfx` calls back into the server while it awaits that subprocess → ~33s then spurious 403). Cross-instance (the real use case) is fast and correct. A guard rejecting self-targeting environments would close this.

## Config / env vars
- `LANGFLOW_DEVOPS_LFX_VERSION` (default `0.4.6`)
- `LANGFLOW_DEVOPS_LFX_BIN` (override for air-gapped / pre-installed binary)
- Per-environment API key is entered in the UI and stored encrypted (no env var required); legacy `api_key_env` references (e.g. `PROD_LANGFLOW_API_KEY`) still work.

## Files touched
- `src/backend/base/langflow/api/v1/promote.py` (new)
- `src/backend/base/langflow/api/v1/__init__.py`, `api/router.py`
- `src/frontend/src/customization/feature-flags.ts`
- `src/frontend/src/controllers/API/helpers/constants.ts`
- `src/frontend/src/controllers/API/queries/promote/*` (new)
- `src/frontend/src/modals/promoteModal/*` (new)
- `src/frontend/src/pages/FlowPage/components/flowSidebarComponent/components/EnvironmentsSidebar/index.tsx` (new)
- `src/frontend/src/pages/FlowPage/components/flowSidebarComponent/index.tsx`, `components/sidebarSegmentedNav.tsx`
- `src/frontend/src/components/ui/sidebar.tsx`
- `src/frontend/src/components/core/flowToolbarComponent/components/deploy-dropdown.tsx`
