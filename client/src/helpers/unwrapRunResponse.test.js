import { unwrapRunResponse, unwrapPageResponse, unwrapContent } from "./unwrapRunResponse";
import { FuseError } from "./fuseError";

// Trimmed from the documented response in yang-db
// docs/tutorial/sample/dragons/query-the-data.md (Query:1, `Match (d:Dragon) return *`).
const QUERY_ID = "4db03973-e509-4263-8a22-c5ad43ae5a96";
const assignment = {
  entities: [
    {
      eTag: ["d"],
      eType: "Dragon",
      id: "100",
      properties: [{ pType: "name", agg: "raw", value: "Bernard Essovius" }]
    }
  ]
};

function runResponse({ requested = 100, actual = 100, assignments = [assignment] } = {}) {
  return {
    requestId: "FR581995536421289984",
    elapsed: "00001367",
    data: {
      resourceUrl: `http://20.10.10.104:8888/fuse/query/${QUERY_ID}`,
      resourceId: QUERY_ID,
      type: "concrete",
      error: null,
      innerUrlResourceInfos: [],
      cursorResourceInfos: [
        {
          resourceId: "1",
          error: null,
          cursorRequest: { cursorType: "forwardPaths", ontology: "Dragons" },
          pageResourceInfos: [
            {
              resourceId: "1",
              requestedPageSize: requested,
              actualPageSize: actual,
              data: {
                queryId: QUERY_ID,
                cursorId: "1",
                pattern: { ont: "Dragons", name: QUERY_ID },
                assignments,
                resultType: "assignments"
              },
              available: true
            }
          ]
        }
      ]
    }
  };
}

describe("unwrapRunResponse", () => {
  test("returns the first page's data and ids", () => {
    const result = unwrapRunResponse(runResponse());
    expect(result.queryId).toBe(QUERY_ID);
    expect(result.cursorId).toBe("1");
    expect(result.page.assignments).toEqual([assignment]);
    expect(result.page.resultType).toBe("assignments");
    expect(result.requestedPageSize).toBe(100);
    expect(result.actualPageSize).toBe(100);
  });

  test("hasMore when the page is full", () => {
    expect(unwrapRunResponse(runResponse({ requested: 100, actual: 100 })).hasMore).toBe(true);
  });

  test("no more when the page is short", () => {
    expect(unwrapRunResponse(runResponse({ requested: 100, actual: 7 })).hasMore).toBe(false);
  });

  test("no more for an empty result", () => {
    const result = unwrapRunResponse(runResponse({ requested: 100, actual: 0, assignments: [] }));
    expect(result.hasMore).toBe(false);
    expect(result.page.assignments).toEqual([]);
  });

  test("accepts a resource without the envelope (getNeighbors)", () => {
    const result = unwrapRunResponse(runResponse().data);
    expect(result.queryId).toBe(QUERY_ID);
    expect(result.page.assignments).toHaveLength(1);
  });

  test("throws the Fuse error carried in a 200", () => {
    const body = runResponse();
    body.data.cursorResourceInfos[0].error = { errorCode: "C", errorDescription: "cursor failed" };
    expect(() => unwrapRunResponse(body)).toThrow(FuseError);
    expect(() => unwrapRunResponse(body)).toThrow("cursor failed");
  });

  test("throws when there is no cursor", () => {
    const body = runResponse();
    body.data.cursorResourceInfos = [];
    expect(() => unwrapRunResponse(body)).toThrow("no cursor");
  });

  test("throws on an empty body", () => {
    expect(() => unwrapRunResponse(null)).toThrow(FuseError);
  });
});

describe("unwrapPageResponse", () => {
  const pageData = runResponse().data.cursorResourceInfos[0].pageResourceInfos[0].data;

  test("unwraps nextPageData", () => {
    const result = unwrapPageResponse({ requestId: "x", data: pageData }, 1);
    expect(result.page).toBe(pageData);
    expect(result.actualPageSize).toBe(1);
    expect(result.hasMore).toBe(true);
  });

  test("no more when fewer than requested", () => {
    expect(unwrapPageResponse({ requestId: "x", data: pageData }, 100).hasMore).toBe(false);
  });

  test("accepts a page resource", () => {
    const resource = runResponse().data.cursorResourceInfos[0].pageResourceInfos[0];
    const result = unwrapPageResponse({ requestId: "x", data: resource }, 100);
    expect(result.page).toBe(resource.data);
    expect(result.hasMore).toBe(true);
  });

  test("throws a Fuse error", () => {
    expect(() =>
      unwrapPageResponse({ requestId: "x", data: { errorCode: "E", errorDescription: "gone" } }, 10)
    ).toThrow("gone");
  });
});

test("unwrapContent only strips a Fuse envelope", () => {
  expect(unwrapContent({ requestId: "x", data: [1] })).toEqual([1]);
  expect(unwrapContent({ data: [1] })).toEqual({ data: [1] });
  expect(unwrapContent("text")).toBe("text");
});
