# V1 query JSON Schema (vendored)

`query.schema.json` is the JSON Schema (draft 2020-12) of YangDB's V1 query wire format, the body of
`POST /fuse/query/v1/run`. `helpers/queryToV1.schema.test.js` validates every V1 query web-ui generates against it.

| | |
|---|---|
| Source | `docs/spec/v1/query.schema.json` in [YANG-DB/yang-db](https://github.com/YANG-DB/yang-db) |
| Copied from | branch `spec/v1-json-schema`, commit `c5983b2be09c4ef5a012746fb96e0d8ad452c5de` ([yang-db PR #196](https://github.com/YANG-DB/yang-db/pull/196), open on 2026-11-26) |
| SHA-256 | `cd6858b50d5a12391a1ad3e2545c886381bfe0c6e7b967cdcfd0e8771e5c1f6b` |

The schema's `$id` points at yang-db's `main`, where it will appear once PR #196 merges. Until then this copy is the
reference. Do not edit it here; to update it, copy the file from yang-db again and update this table:

```bash
git -C ../yang-db show origin/main:docs/spec/v1/query.schema.json > client/src/spec/v1/query.schema.json
shasum -a 256 client/src/spec/v1/query.schema.json
```

The schema says what Fuse **accepts**, not what a given Fuse version **runs**: Fuse 0.9.1 accepts but fails `contains`,
`not contains`, `not match`, `starts with` and `ends with` on text fields. `helpers/queryToV1.js` only emits operators
that both validate and run, and the live suite (`yarn test:fuse`) checks the running part.
