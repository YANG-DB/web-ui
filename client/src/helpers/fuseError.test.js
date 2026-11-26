import { FuseError, findFuseError, toFuseError } from "./fuseError";

// Bodies captured from Fuse 0.9.1 (yang-db) running the Dragons sample.
const unknownEntity = {
  requestId: "FR1310795426085404672",
  elapsed: "00000009",
  data: {
    errorCode: "No Ontology entity for value ",
    errorDescription: "No Ontology entity for value[Nope]"
  }
};

const unknownLanguage = {
  errorCode: "Unknown query language",
  errorDescription:
    "No query language 'zzz'; available languages: [cypher, graphQL, sparkQL, sparql]",
  languages: ["cypher", "graphQL", "sparkQL", "sparql"]
};

describe("toFuseError", () => {
  test("reads errorDescription from an enveloped 500", () => {
    const err = toFuseError(500, unknownEntity);
    expect(err).toBeInstanceOf(FuseError);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("No Ontology entity for value[Nope]");
    expect(err.description).toBe(err.message);
    expect(err.code).toBe("No Ontology entity for value ");
    expect(err.status).toBe(500);
  });

  test("reads a bare error body (unknown language 404)", () => {
    const err = toFuseError(404, unknownLanguage);
    expect(err.code).toBe("Unknown query language");
    expect(err.message).toMatch(/available languages/);
    expect(err.details.languages).toContain("graphQL");
  });

  test("falls back to {message}", () => {
    expect(toFuseError(400, { message: "bad" }).message).toBe("bad");
  });

  test("falls back to a text body", () => {
    expect(toFuseError(502, "  Bad Gateway \n").message).toBe("Bad Gateway");
  });

  test("falls back to the status", () => {
    const err = toFuseError(503, null);
    expect(err.message).toBe("Fuse request failed with status 503");
    expect(err.code).toBeNull();
  });

  test("uses errorCode when there is no description", () => {
    expect(toFuseError(500, { errorCode: "Query" }).message).toBe("Query");
  });
});

describe("findFuseError", () => {
  test("returns null for a successful body", () => {
    expect(findFuseError({ requestId: "x", data: { error: null, cursorResourceInfos: [] } })).toBeNull();
    expect(findFuseError(null)).toBeNull();
    expect(findFuseError("Alive And Well...")).toBeNull();
    expect(findFuseError({ requestId: "x", data: true })).toBeNull();
  });

  test("finds data.error inside a 200", () => {
    const err = findFuseError({
      requestId: "x",
      data: { error: { errorCode: "E", errorDescription: "query failed" } }
    });
    expect(err.message).toBe("query failed");
    expect(err.status).toBeNull();
  });

  test("finds a cursor error", () => {
    const err = findFuseError({
      data: { error: null, cursorResourceInfos: [{ error: { errorDescription: "cursor failed" } }] }
    });
    expect(err.message).toBe("cursor failed");
  });

  test("finds a page error", () => {
    const err = findFuseError({
      data: {
        cursorResourceInfos: [
          { error: null, pageResourceInfos: [{ error: { errorCode: "P", errorDescription: "page failed" } }] }
        ]
      }
    });
    expect(err.code).toBe("P");
    expect(err.message).toBe("page failed");
  });
});
