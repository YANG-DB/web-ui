# web-ui plan: connect to Fuse, then make the query UX first-class

Brief for the agent working in this repo (`YANG-DB/web-ui`, default branch `master`). Written 2026-11-26.
Keep this file current: tick boxes as work lands and update **Status** at the bottom.

## Goal

1. The UI talks to a running YangDB (Fuse) server directly, with no mock layer in between. Mock mode stays as an
   opt-in for demos and tests.
2. Submitting a query and reading its result is as clear as the best open-source graph UIs (see **References**).

Work in this order. Part A unblocks everything else, because nothing can be judged against real data until it lands.

## Ground rules

- **One PR per numbered item** (or per small group), from a branch. Never push to `master`.
- **Mock mode must keep working** after every PR. `server.js` and `mocks/` stay as the mock backend.
- **No Fuse server changes from this repo.** Fuse lives in `YANG-DB/yang-db`. If a Fuse change is needed, write it
  under **Fuse-side asks** below and work around it in the UI.
- **Tests:** add or update Jest tests for every helper you touch (`client/src/helpers/*.test.js` is the pattern).
  Run `yarn test` in `client/` and the root `npm test` (server) before each PR.
- **Screenshots:** when a PR changes what the Research page looks like, refresh the matching image in `docs/images/`
  and the README section that shows it.
- **External drive quirk:** this clone sits on an exFAT/APFS external drive that fakes file-mode changes and creates
  `._*` AppleDouble files. `git status` currently shows ~181 mode-only "modified" files. Before starting, run
  `git config core.fileMode false` and delete stray `._*` files. Do not commit mode-only changes.

## Current state (verified 2026-11-26)

- `client/src/services/api.js` calls only `/api/*` on the Express server in `server.js` (port 5001, CRA proxy).
- `server.js` serves static JSON from `mocks/` for every route. **The UI has never called Fuse.**
- The result shape the UI parses (`mocks/queries/ResultLarge.json`, `helpers/extractResults.js`) is Fuse's
  assignments page data: `data.assignments[].entities[] / relationships[]`. That is good news: the parsing layer
  already speaks Fuse.
- The ontology mocks (`mocks/ontology/*/ontology.json`) use Fuse's ontology format
  (`ont, entityTypes, relationshipTypes, properties, enumeratedTypes, compositeTypes`) inside a
  `{requestId, elapsed, data}` envelope. Also compatible.
- The visual builder (`components/VisualQueryBuilder.js`) produces JSON, GraphQL and Cypher previews. The Cypher
  generator is described in code as "Neo4j Cypher-like" and has never been run against Fuse.
- The graph (`components/Force.js`, Cytoscape) has a per-type `entityColors` map, but the node color function
  returns a connectivity color whenever `degree > 0`, so type colors almost never show.
- `HistoryItem` exists and is imported in `Results.js`, but there is no visible query history on the Research page.
- `monaco-editor` is a dependency but is only used for previews, not as a query input.

## Part A: direct, simple calls to Fuse

### What Fuse already offers (from `yang-db` main, `fuse-service/.../appRegistrars`)

Default Fuse URL in Docker: `http://localhost:8888`.

| Need | Fuse route | Notes |
|---|---|---|
| Is the server up | `GET /fuse/health` | Plain text "Alive And Well..." |
| List ontologies | `GET /fuse/catalog/ontology` | |
| One ontology | `GET /fuse/catalog/ontology/:id` | Ids are capitalized, e.g. `Dragons`. The UI uses lowercase `dragons`. |
| Schema | `GET /fuse/catalog/schema`, `GET /fuse/catalog/schema/:id` | Check the format before wiring the Schema page. |
| Run Cypher in one call | `GET` or `POST /fuse/query/cypher/run` | Parameters: `cypher` (or `query`), `ontology`, `pageSize` (default 1000), `cursorType`. They are read as request parameters (query string or form body), **not** a JSON body. |
| Run any registered language | `GET` or `POST /fuse/query/:lang/run` | Unknown `lang` returns 404 listing the available languages. Use it to discover whether GraphQL is accepted. |
| Run the V1 JSON query | `POST /fuse/query/v1/run` | Body is a V1 `Query` JSON. |
| Next page | `GET /fuse/query/:queryId/cursor/:cursorId/nextPageData?pageSize=N` | Also `POST .../cursor/:cursorId/page`. |
| Expand a node | `GET /fuse/query/graph/api/getNeighbors?ontology=&type=&id=` | Also `getVertex` and `findPath`. **No tests exist for these in yang-db.** Verify before relying on them. |
| Free a stored query | `DELETE /fuse/query/:queryId` | Every run stores a query server-side. |
| Explain | `GET /fuse/query/:queryId/plan/print`, `/asg/print` | Nice-to-have "Explain" tab. |

CORS is already open on Fuse (`Access-Control-Allow-Origin: *`, OPTIONS answered). There is no authentication.

### What is missing, and the fix

- [x] **A1. Fuse client module.** Add `client/src/services/fuse.js`, separate from the mock `api.js`. Base URL comes
  from `REACT_APP_FUSE_URL` (default `/fuse` behind the dev proxy). Functions: `health()`, `listOntologies()`,
  `getOntology(id)`, `runCypher(text, {ontology, pageSize})`, `runLanguage(lang, text, opts)`,
  `nextPage(queryId, cursorId, pageSize)`, `getNeighbors(ontology, type, id)`, `deleteQuery(queryId)`.
  Send run parameters as `application/x-www-form-urlencoded`, not JSON.
  *Done:* also `fuseBaseUrl()`. Tests in `services/fuse.test.js` (mocked `fetch`).
- [x] **A2. Dev proxy for both backends.** CRA's single `"proxy"` field can only point at one server. Replace it with
  `client/src/setupProxy.js` (http-proxy-middleware): `/api` goes to the mock server on 5001, `/fuse` goes to
  `REACT_APP_FUSE_URL` or `http://localhost:8888`. Document both in the README quick start.
  *Done, with one change:* `REACT_APP_FUSE_URL` is the client's base URL and may be relative (`/fuse`), so the
  proxy target is a separate dev-server variable, `FUSE_PROXY_TARGET` (default `http://localhost:8888`); the mock
  target is `MOCK_PROXY_TARGET`. Uses the `http-proxy-middleware` 2.x that `react-scripts` already installs (adding it
  to `package.json` forced a large, unrelated `yarn.lock` refresh). Verified live: `/api` and `/fuse` both answer
  through the dev server.
- [x] **A3. Response unwrapping.** A run returns query, then `cursorResourceInfos[0]`, then
  `pageResourceInfos[0].data`. The UI expects the page data directly. Add a pure helper
  `helpers/unwrapRunResponse.js` that returns `{queryId, cursorId, page: data, hasMore}`, with tests built from the
  documented response in yang-db `docs/tutorial/sample/dragons/query-the-data.md`. Keep `extractResults` unchanged.
  *Done:* also `unwrapPageResponse` (for `nextPageData`) and `unwrapContent` (strips the envelope). Both accept the
  response with or without the `{requestId, data}` envelope, because `getNeighbors` returns it without.
- [x] **A4. Error handling.** `callApi` assumes errors look like `{message}`. Fuse errors carry `errorCode` and
  `errorDescription`, sometimes inside `data.error` with a 200 status. Normalize both into one `FuseError` and
  show `errorDescription` to the user in the results panel, not only in the console.
  *Half done:* `helpers/fuseError.js` (`FuseError`, `toFuseError`, `findFuseError`) normalizes every shape seen
  live (enveloped 500, bare 404 for an unknown language, errors inside a 200), and `fuse.js` throws it.
  *Done (UI):* the Research page shows `Query failed: <errorDescription>` in the results panel (`RunStatus`).
- [x] **A5. Backend switch.** Replace the "USE MOCK DATA" checkbox with a backend selector: *Fuse* or *Mock*.
  Show a connection dot driven by `health()`, and fall back to Mock with a visible notice when Fuse is down.
  *Done, with three options:* Fuse, Mock server (`server.js`, as before) and Generated sample (the old "USE MOCK
  DATA" checkbox). The dot polls `health()` every 15 s. Fuse is picked at start-up when it answers.
- [x] **A6. Ontologies from Fuse.** In Fuse mode, load the ontology list and the selected ontology from the catalog.
  Map ids case-insensitively, so `dragons` finds `Dragons`. Templates stay in `mocks/ontology/*/templates.json`,
  since Fuse has no templates endpoint; hide templates for ontologies that have none.
  *Done:* `resolveOntologyId` in `helpers/normalizeFuseResult.js`; the builder and the template picker take a
  `loadOntology` prop. Templates live in `constants/queryTemplates.js` (they were inline in `QueryTemplates.js`; the
  mock server's `templates.json` files are a separate copy). The picker already says "No templates available".
- [x] **A7. Submit the builder's query to Fuse.** Send the builder's Cypher to `/fuse/query/cypher/run`.
  First run every template's Cypher against a Fuse loaded with the Dragons sample and record pass or fail in
  this file. Fix the generator where it emits syntax Fuse rejects. Known Fuse Cypher limits (yang-db
  `docs/revival/KNOWN_ISSUES.md`): no node-label union `(n:A|B)`, use `WHERE n:A OR n:B`; no cyclic patterns;
  `(n:A:B)` means "any of" rather than "all of".
  *Done:* generator extracted to `helpers/queryToCypher.js` (shared model in `helpers/analyzeQuery.js`, snapshot
  tests for every template of all three ontologies). Fixed: relationship types were upper-cased (`OWN`, rejected);
  property-only queries produced `MATCH (n) WHERE p.x ...`, which Fuse runs while ignoring the unbound filter
  (1000 unrelated rows); `Person Know Person` reused one variable (a cycle); quotes in values were not escaped.
  Template values changed to ones in the data (`BLACK`, `RED`/`BLUE`, `MALE`/`FEMALE`, `Christiana`), and template 8
  is now a connected pattern (the old one, two disconnected chains, got "UnionPlanSearcher - No valid plan").

  Results against Fuse 0.9.1 with the Dragons sample (`yarn test:fuse`, page size 100):

  | # | Template | Before | Cypher | V1 |
  |---|---|---|---|---|
  | 0 | Find all persons by first name | unrelated rows (`MATCH (n)`, filter ignored) | 100 | 100 |
  | 1 | Find dragons with specific color | unrelated rows (`MATCH (n)`) | 100 (121 total) | 100 |
  | 2 | Find entities with multiple attributes | unrelated rows (`MATCH (n)`) | 100 | 100 |
  | 3 | Find entities using OR condition | unrelated rows (`MATCH (n)`) | 100 | 100 |
  | 4 | Complex nested query example | unrelated rows (`MATCH (n)`) | 100 | 100 |
  | 5 | Find dragons owned by persons | rejected (`OWN`) | 96 | 96 |
  | 6 | Find persons who are members of guilds | rejected (`MEMBEROF`) | 83 | 83 |
  | 7 | Find persons who know someone named Christiana | rejected; no George in the data | 10 | 10 |
  | 8 | Black dragon owners with a horse from a funded kingdom | no valid plan | 100 | 100 |
- [x] **A8. Paging.** Request a sensible `pageSize` (100 for the graph view). Show "N results, load more" when
  `actualPageSize == requestedPageSize`, using `nextPage`. Merge new assignments into the existing result.
  *Done:* `appendFuseResult`; verified live (121 black dragons: 100, then 21 and the button goes away).
- [ ] **A9. Expand node.** Wire the existing `updateResult(nodeId)` path to `getNeighbors` in Fuse mode. If the route
  turns out broken, record it under **Fuse-side asks** and fall back to running
  `MATCH (n:<Type>)-[r]-(m) WHERE id(n) = '<id>' RETURN *` through `runCypher`, if Fuse supports that form.
  *Half done:* `fuse.getNeighbors` works and is covered live; its result normalizes (the node's own id is
  `Dragon_100`). Not yet wired to the graph's expand action: `Force.js` still calls the mock `updateResult`, and the
  entity's raw `id` and `eType` are now on each node for this.
- [x] **A10. Query cleanup.** Call `deleteQuery` for a result the user discards or replaces, so stored queries don't
  pile up on the server.
  *Done:* the previous query is deleted when a run replaces it or the backend changes.
- [x] **A11. Integration check.** Add a script or test, skipped unless `FUSE_URL` is set, that runs health, ontology
  load and one template against a live Fuse. Document how to start Fuse with yang-db's Docker setup.
  *Done, wider:* `client/src/integration/fuse.integration.test.js` (`yarn test:fuse`) covers every `fuse.js` call,
  every Dragons template in Cypher and V1, and the Dragons tutorial's queries and counts. `scripts/fuse-up.sh` starts
  OpenSearch and Fuse with plain `docker run` (no yang-db checkout) and loads the data; CI's `fuse-integration` job
  uses it. Tutorial: `docs/tutorials/DRAGONS.md`.

### A12. V1 as a second query language (asked for on 2026-11-26)

- [x] `helpers/queryToV1.js` turns the builder's query into a V1 query (Start, ETyped, Rel, EProp, EPropGroup with
  `all`/`some`, Quant1 for branches). Numbers are typed from the ontology. contains / begins with / ends with go out
  as `like` with `*` wildcards, which Fuse supports where its Cypher does not.
- [x] What V1 cannot express is refused with a clear message, not sent: an OR across conditions on different
  entities, disconnected patterns, cycles.
- [x] `fuse.runV1(query, {pageSize})` posts the JSON to `/fuse/query/v1/run`. The Research page has a
  **Language** selector (Cypher / V1) in Fuse mode, and the preview shows "V1 (Fuse)".
- [ ] Next: a raw V1 JSON editor next to the Cypher editor of B5.

### Fuse-side asks (for the yang-db repo, not this one)

Record anything you hit here with the request, the response and the expected behavior. Known candidates:

- No tests cover `graph/api/getNeighbors`, `getVertex` or `findPath`. They may not work.
  *Checked on 0.9.1:* `getNeighbors?ontology=Dragons&type=Dragon&id=100` works (11 entities, 51 relationships), but
  it returns the query resource **without** the `{requestId, data}` envelope every other route uses. Ask: wrap it
  like the rest.
- The Dragons tutorial docs say `POST /dragons/tutorial/load`; on 0.9.1 the route is `POST /fuse/dragons/tutorial/load`
  (the bare path is a 404).
- GraphQL is registered as `graphQL` (case-insensitive match works). Languages on 0.9.1: `cypher, graphQL, sparkQL,
  sparql`.
- A "flat" run option (return only the first page's data) would let simple clients skip the unwrapping in A3.
- Ontology ids are case-sensitive.
- **Concurrent runs fail.** Two `POST /fuse/query/cypher/run` (or `v1/run`) at the same moment: one answers 200 with
  `data.error = {errorCode: "Query", errorDescription: "failed building the cursor request forwardPaths:
  java.lang.IllegalStateException: zip file closed"}`. Expected: both succeed. Worked around: `fuse.js` sends runs
  one at a time (`serialized`).
- **`CONTAINS` is not supported** in Cypher (`contains not supported constraint`) nor as V1 op `contains`. V1 `like`
  with wildcards works, so web-ui uses that. Expected: `CONTAINS` maps to the same.
- **`STARTS WITH` / `ENDS WITH`** (Cypher) and V1 `starts with` / `ends with` on `Person.firstName` (a `text` field)
  return 0 rows where `like 'C*'` matches. Expected: the same rows as `like`.
- Errors inside a 200 (above) make clients check `data.error`, `cursorResourceInfos[].error` and
  `pageResourceInfos[].error` on every success. Expected: a non-2xx status.
- No authentication. Fine for local use, a blocker before any shared deployment.

## Part B: query UX

References to study before designing (stars as of 2026-11-26):

| Repo | What to take from it |
|---|---|
| `aws/graph-explorer` (494★) | Node styling: type icon, display name, neighbor-count badge. Properties side panel. Table synced to graph. |
| `sparna-git/Sparnatural` (317★) | Path builder that reads like a sentence: Museum, then country, then Country, as chips. |
| `neo4j/neo4j-browser` (829★), `FalkorDB/falkordb-browser` (139★) | Compact query bar on top, results stacked as frames with history. |
| `graphql/graphiql` (16.9k★) | Text editor and visual explorer side by side, kept in sync. |
| `apache/age-viewer` (394★) | Similar browser-style layout over a non-Neo4j engine. |

### B1. Graph readability (do first: cheapest, biggest visual change)

- [ ] **Color by entity type.** In `Force.js`, use `entityColors[eType]` always. Show connectivity through node size
  only, which already happens. Generate colors for types missing from the map from a fixed palette, so other
  ontologies (Flights, LinkedIn and those loaded from Fuse) get distinct colors too.
- [ ] **Readable labels.** Label a node with its first present display property (`name`, `title`, `firstName`
  plus `lastName`, then the first string property), and fall back to `eID`. Show the type above the name in
  smaller text.
- [ ] **Legend.** One chip per entity type with color and count. Clicking a chip hides or shows that type.
- [ ] **Quieter edges.** Hide edge labels by default. Show them on hover, on the selected node's edges, or above a
  zoom threshold.
- [ ] **Layout control.** Replace the always-visible "Edge Length / Node Repulsion" panel with a layout dropdown
  (force, breadth-first, concentric, grid) plus "Fit". Move the sliders into a settings popover.

### B2. Inspect results

- [ ] **Details side panel.** Clicking a node or edge opens a right-hand panel with type, id and all properties,
  plus "Expand neighbors" (A9) and "Hide".
- [ ] **Graph and table together.** An optional table under the graph lists visible nodes, with selection synced
  both ways and a filter per column.

### B3. Page layout

- [ ] **Results get the space.** After a run, collapse the builder to a one-line summary of the query (the path in
  words, e.g. "Person, originated in, Kingdom where funds > 1000"), with an Edit button. The results take the rest.
- [ ] **History.** Keep the last 20 runs in the store and in `localStorage`. Show them as a list (query summary,
  time, result count) that re-opens a result or reloads the query into the builder. Reuse `HistoryItem`.
- [ ] **Empty and loading states.** *Partly done:* spinner with an elapsed timer and the A4 error message are in;
  an empty result no longer crashes the page. Still missing: the "Run a query or pick a template" empty state. Show a clear "Run a query or pick a template" empty state, a spinner with an
  elapsed timer while running, and the error message from A4 on failure.

### B4. Path builder

- [ ] Replace the AND / +Rule / +Group tree for **traversals** with a chip chain: entity, relationship, entity, and so
  on. Each chip is a dropdown limited by the ontology: after an entity, offer only its relationship types; after a
  relationship, only its valid targets. Branches get a "+" under any entity chip.
- [ ] Keep `react-querybuilder` only for **property conditions**, attached to the chip they filter.
- [ ] The JSON, GraphQL and Cypher previews must produce the same output as today for every template. Snapshot-test
  this before the change and keep the snapshots green after it.

### B5. Text editor as an equal input

- [ ] A Builder / Cypher toggle. The Cypher tab is a Monaco editor with keyword highlighting and completion for
  ontology types, relationship types and property names. Ctrl+Enter runs.
- [ ] Builder to Cypher stays in sync. Cypher to Builder is out of scope for now: if the user edits the text, the
  builder shows "edited as text" and stops syncing until reset.

### B6. Visual polish

- [ ] Row actions (add, delete) appear as icons on hover, instead of a red and blue button on every row.
- [ ] One button hierarchy: a single primary "Run" button, the rest secondary or ghost.
- [ ] Check contrast and keyboard focus for every control in both the builder and the results panel.

## Definition of done

- With Fuse running the Dragons sample, a new user can pick a template, run it, read node names and types at a
  glance, open a node's properties, expand its neighbors and load more results, without touching mock mode.
- Every template's pass or fail against Fuse is recorded here, and failures are either fixed or listed under
  **Fuse-side asks**.
- README screenshots show the new UI.

## Status

- 2026-11-26: Housekeeping done (`core.fileMode=false`, ~950 `._*` files deleted, `._*` added to `.gitignore`).
- 2026-11-26: A1-A3 and the A4 helpers in PR #46 (`fuse/a1-a4-client`).
- 2026-11-26: A4 (UI), A5, A6, A7, A8, A10, A11 and A12 (V1) done on `fuse/ui-v1-ci-release`, stacked on #46.
  CI rewritten (server, client, live Fuse job), Release workflow publishes from `vX.Y.Z` tags, version 0.2.0,
  Dragons tutorial. Fixed on the way: empty results crashed the page, re-running during a layout animation crashed
  it, the root tests could not run in CI (`jest`/`supertest` undeclared), and the server coverage gate now passes
  (96% statements, 82% branches).
- Definition of done, Part A: a new user can pick a template, run it against Fuse, page through results and see
  errors, without touching mock mode. Still missing: readable names and types (B1), a properties panel (B2) and
  expand neighbors in the graph (A9).

**Next step:** B1 (graph readability), then A9's UI half with the B2 details panel.
