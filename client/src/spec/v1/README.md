# V1 query JSON Schema (vendored)

`query.schema.json` is the JSON Schema (draft 2020-12) of YangDB's V1 query wire format, the body of
`POST /fuse/query/v1/run`. Fuse publishes it at **`GET /fuse/query/v1/schema`**.

- `helpers/queryToV1.schema.test.js` validates every V1 query web-ui generates against this copy (unit tests, no
  server needed).
- `integration/fuse.integration.test.js` (`yarn test:fuse`) fetches the schema from the running Fuse, checks it is the
  same as this copy, and validates every template against the served one. Fuse versions without the endpoint (such
  as the 0.9.1 image CI uses) skip that check.

| | |
|---|---|
| Source | `docs/spec/v1/query.schema.json` in [YANG-DB/yang-db](https://github.com/YANG-DB/yang-db), served by `GET /fuse/query/v1/schema` ([#196](https://github.com/YANG-DB/yang-db/pull/196), [#197](https://github.com/YANG-DB/yang-db/pull/197)) |
| Copied from | branch `spec/v1-json-schema`, merge commit `8fcd96d73` (#197), the same bytes a Fuse built from it serves |
| SHA-256 | `583db28a65ddb92dc4dbb0ccdc2b2d701aadaa0a98f4b896a76ee5888a715e17` |

On 2026-11-26 yang-db `main` has #196 but not yet #197: #197 merged into `spec/v1-json-schema` after that branch had
already gone into `main`. `main`'s copy is the earlier version, a subset of this one (#197 adds `RelUntyped` and
`WhereByConstraint`).

Do not edit the file here. To update it, copy it from a running Fuse (or from yang-db) and update the table:

```bash
curl -s http://localhost:8888/fuse/query/v1/schema > client/src/spec/v1/query.schema.json
shasum -a 256 client/src/spec/v1/query.schema.json
```

The schema says what Fuse **accepts**, not what a given Fuse version **runs**: Fuse 0.9.1 accepts but fails `contains`,
`not contains`, `not match`, `starts with` and `ends with` on text fields. `helpers/queryToV1.js` only emits operators
that both validate and run, and the live suite checks the running part.
