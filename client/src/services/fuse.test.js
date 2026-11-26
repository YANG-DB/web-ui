import fuse, { fuseBaseUrl } from "./fuse";
import { FuseError } from "../helpers/fuseError";

function reply(status, body) {
  const text = body == null ? "" : typeof body === "string" ? body : JSON.stringify(body);
  return Promise.resolve({ ok: status >= 200 && status < 300, status, text: () => Promise.resolve(text) });
}

const runBody = {
  requestId: "r",
  data: {
    resourceId: "q1",
    cursorResourceInfos: [
      {
        resourceId: "1",
        pageResourceInfos: [
          { requestedPageSize: 2, actualPageSize: 2, data: { queryId: "q1", cursorId: "1", assignments: [{}, {}] } }
        ]
      }
    ]
  }
};

beforeEach(() => {
  global.fetch = jest.fn();
  delete process.env.REACT_APP_FUSE_URL;
});

test("fuseBaseUrl defaults to /fuse and trims trailing slashes", () => {
  expect(fuseBaseUrl({})).toBe("/fuse");
  expect(fuseBaseUrl({ REACT_APP_FUSE_URL: "http://localhost:8888/fuse/" })).toBe(
    "http://localhost:8888/fuse"
  );
});

test("runCypher posts form parameters, not JSON", async () => {
  fetch.mockReturnValue(reply(200, runBody));
  const result = await fuse.runCypher("MATCH (d:Dragon) RETURN *", { ontology: "Dragons", pageSize: 2 });

  const [url, init] = fetch.mock.calls[0];
  expect(url).toBe("/fuse/query/cypher/run");
  expect(init.method).toBe("POST");
  expect(init.headers["Content-Type"]).toMatch(/application\/x-www-form-urlencoded/);
  const params = new URLSearchParams(init.body);
  expect(params.get("query")).toBe("MATCH (d:Dragon) RETURN *");
  expect(params.get("ontology")).toBe("Dragons");
  expect(params.get("pageSize")).toBe("2");
  expect(params.has("cursorType")).toBe(false);

  expect(result).toMatchObject({ queryId: "q1", cursorId: "1", hasMore: true });
  expect(result.page.assignments).toHaveLength(2);
});

test("uses REACT_APP_FUSE_URL", async () => {
  process.env.REACT_APP_FUSE_URL = "http://fuse:8888/fuse";
  fetch.mockReturnValue(reply(200, runBody));
  await fuse.runLanguage("graphQL", "{ x }", { ontology: "Dragons" });
  expect(fetch.mock.calls[0][0]).toBe("http://fuse:8888/fuse/query/graphQL/run");
  expect(new URLSearchParams(fetch.mock.calls[0][1].body).get("pageSize")).toBe("100");
});

test("a Fuse error becomes a FuseError with the description", async () => {
  fetch.mockReturnValue(
    reply(500, { requestId: "r", data: { errorCode: "E", errorDescription: "No Ontology entity for value[Nope]" } })
  );
  await expect(fuse.runCypher("MATCH (n:Nope) RETURN *", { ontology: "Dragons" })).rejects.toMatchObject({
    name: "FuseError",
    message: "No Ontology entity for value[Nope]",
    status: 500
  });
});

test("a network failure becomes a FuseError", async () => {
  fetch.mockReturnValue(Promise.reject(new TypeError("Failed to fetch")));
  await expect(fuse.listOntologies()).rejects.toBeInstanceOf(FuseError);
});

test("health is true when Fuse answers, false otherwise", async () => {
  fetch.mockReturnValueOnce(reply(200, '"Alive And Well..."'));
  expect(await fuse.health()).toBe(true);
  expect(fetch.mock.calls[0][0]).toBe("/fuse/health");

  fetch.mockReturnValueOnce(reply(502, "Bad Gateway"));
  expect(await fuse.health()).toBe(false);

  fetch.mockReturnValueOnce(Promise.reject(new TypeError("Failed to fetch")));
  expect(await fuse.health()).toBe(false);
});

test("listOntologies drops catalog entries without an id", async () => {
  fetch.mockReturnValue(reply(200, { requestId: "r", data: [{ entityTypes: [] }, { ont: "Dragons" }] }));
  expect(await fuse.listOntologies()).toEqual([{ ont: "Dragons" }]);
});

test("getOntology unwraps the envelope", async () => {
  fetch.mockReturnValue(reply(200, { requestId: "r", data: { ont: "Dragons" } }));
  expect(await fuse.getOntology("Dragons")).toEqual({ ont: "Dragons" });
  expect(fetch.mock.calls[0][0]).toBe("/fuse/catalog/ontology/Dragons");
});

test("nextPage calls nextPageData with pageSize", async () => {
  fetch.mockReturnValue(reply(200, { requestId: "r", data: { assignments: [{}] } }));
  const result = await fuse.nextPage("q1", "1", 5);
  expect(fetch.mock.calls[0][0]).toBe("/fuse/query/q1/cursor/1/nextPageData?pageSize=5");
  expect(result).toMatchObject({ actualPageSize: 1, hasMore: false });
});

test("getNeighbors passes ontology, type and id", async () => {
  fetch.mockReturnValue(reply(200, runBody.data));
  const result = await fuse.getNeighbors("Dragons", "Dragon", "100");
  expect(fetch.mock.calls[0][0]).toBe(
    "/fuse/query/graph/api/getNeighbors?ontology=Dragons&type=Dragon&id=100"
  );
  expect(result.queryId).toBe("q1");
});

test("deleteQuery sends DELETE and skips empty ids", async () => {
  fetch.mockReturnValue(reply(202, { requestId: "r", data: true }));
  expect(await fuse.deleteQuery("q1")).toBe(true);
  expect(fetch.mock.calls[0]).toEqual(["/fuse/query/q1", expect.objectContaining({ method: "DELETE" })]);

  expect(await fuse.deleteQuery(null)).toBe(false);
  expect(fetch).toHaveBeenCalledTimes(1);
});
