# web-ui

React (CRA) client in `client/`, mock Express backend in `server.js` (port 5001), real backend is YangDB Fuse
(`YANG-DB/yang-db`, default `http://localhost:8888`).

**Active plan:** `docs/UX_AND_FUSE_PLAN.md`. Read it first, follow its ground rules, and keep its checkboxes and
Status section current as work lands.

- Default branch is `master`. Work on branches and open PRs; never push to `master`.
- This clone is on an external drive: keep `core.fileMode=false`, delete `._*` files, never commit mode-only changes.
- Tests: `yarn test` in `client/`, `npm test` at the root.
