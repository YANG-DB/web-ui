/**
 * Live checks of every Fuse call the UI makes, against a running YangDB (Fuse) with the
 * Dragons sample loaded. Skipped unless FUSE_URL is set:
 *
 *   FUSE_URL=http://localhost:8888 yarn test:fuse
 *
 * See docs/tutorials/DRAGONS.md for starting Fuse and loading the data.
 *
 * @jest-environment node
 */
import http from "http";
import https from "https";
import fuse from "../services/fuse";
import { FuseError } from "../helpers/fuseError";
import queryToCypher from "../helpers/queryToCypher";
import queryToV1 from "../helpers/queryToV1";
import normalizeFuseResult, { resolveOntologyId } from "../helpers/normalizeFuseResult";
import extractResults from "../helpers/extractResults";
import templates from "../constants/queryTemplates";

const FUSE_URL = process.env.FUSE_URL;
const describeLive = FUSE_URL ? describe : describe.skip;
jest.setTimeout(60000);

// Jest 27's node environment has no fetch; this is the subset fuse.js uses.
function nodeFetch(url, init = {}) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const client = target.protocol === "https:" ? https : http;
    const req = client.request(
      target,
      { method: init.method || "GET", headers: init.headers || {} },
      res => {
        const chunks = [];
        res.on("data", chunk => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            text: () => Promise.resolve(text)
          });
        });
      }
    );
    req.on("error", reject);
    if (init.body) req.write(init.body);
    req.end();
  });
}

const created = [];
function track(result) {
  if (result && result.queryId) created.push(result.queryId);
  return result;
}

describeLive("Fuse API (live)", () => {
  let ontologyId;
  let ontology;

  beforeAll(async () => {
    global.fetch = nodeFetch;
    process.env.REACT_APP_FUSE_URL = `${FUSE_URL.replace(/\/+$/, "")}/fuse`;
  });

  afterAll(async () => {
    await Promise.all(created.map(id => fuse.deleteQuery(id).catch(() => null)));
  });

  test("health", async () => {
    expect(await fuse.health()).toBe(true);
  });

  test("listOntologies includes Dragons", async () => {
    const list = await fuse.listOntologies();
    ontologyId = resolveOntologyId(list.map(o => o.ont), "dragons");
    expect(ontologyId).toBe("Dragons");
  });

  test("getOntology returns entity and relationship types", async () => {
    ontology = await fuse.getOntology("Dragons");
    expect(ontology.ont).toBe("Dragons");
    expect(ontology.entityTypes.map(e => e.eType)).toEqual(expect.arrayContaining(["Person", "Dragon", "Kingdom"]));
    expect(ontology.relationshipTypes.map(r => r.rType)).toEqual(expect.arrayContaining(["Own", "Know", "Fire"]));
  });

  test("runCypher, unwrapped and normalized", async () => {
    const result = track(await fuse.runCypher("MATCH (p:Person)-[o:Own]->(d:Dragon) RETURN *", { ontology: "Dragons", pageSize: 5 }));
    expect(result.queryId).toBeTruthy();
    expect(result.cursorId).toBe("1");
    expect(result.actualPageSize).toBe(5);
    expect(result.hasMore).toBe(true);

    const r = extractResults(normalizeFuseResult(result.page));
    expect(r.entities.length).toBeGreaterThan(0);
    const ids = new Set(r.entities.map(e => e.eID));
    r.relationships.forEach(rel => {
      expect(ids.has(rel.eID1)).toBe(true);
      expect(ids.has(rel.eID2)).toBe(true);
    });
  });

  test("runV1", async () => {
    const query = {
      name: "it",
      ont: "Dragons",
      elements: [
        { eNum: 0, type: "Start", next: 1 },
        { eNum: 1, type: "ETyped", eTag: "d", eType: "Dragon", next: 2 },
        { eNum: 2, type: "EProp", pType: "color", con: { type: "Constraint", op: "eq", expr: "BLACK" } }
      ]
    };
    const result = track(await fuse.runV1(query, { pageSize: 10 }));
    expect(result.actualPageSize).toBe(10);
  });

  test("runLanguage with an unknown language lists the available ones", async () => {
    await expect(fuse.runLanguage("nope", "x", { ontology: "Dragons" })).rejects.toMatchObject({
      name: "FuseError",
      status: 404,
      message: expect.stringMatching(/available languages/)
    });
  });

  test("a bad query becomes a FuseError with Fuse's description", async () => {
    const error = await fuse.runCypher("MATCH (n:Nope) RETURN *", { ontology: "Dragons" }).catch(e => e);
    expect(error).toBeInstanceOf(FuseError);
    expect(error.message).toMatch(/Nope/);
  });

  test("nextPage continues a cursor", async () => {
    const first = track(await fuse.runCypher("MATCH (d:Dragon) RETURN *", { ontology: "Dragons", pageSize: 5 }));
    const next = await fuse.nextPage(first.queryId, first.cursorId, 5);
    expect(next.actualPageSize).toBe(5);
    expect(next.hasMore).toBe(true);
    const firstIds = first.page.assignments.map(a => a.entities[0].id);
    const nextIds = next.page.assignments.map(a => a.entities[0].id);
    expect(nextIds.filter(id => firstIds.includes(id))).toEqual([]);
  });

  test("getNeighbors expands a node", async () => {
    const result = track(await fuse.getNeighbors("Dragons", "Dragon", "100"));
    const r = extractResults(normalizeFuseResult(result.page));
    expect(r.entities.map(e => e.eID)).toContain("Dragon_100");
    expect(r.relationships.length).toBeGreaterThan(0);
  });

  test("deleteQuery frees a stored query", async () => {
    const result = await fuse.runCypher("MATCH (k:Kingdom) RETURN *", { ontology: "Dragons", pageSize: 1 });
    expect(await fuse.deleteQuery(result.queryId)).toBe(true);
  });

  // The queries and counts quoted in docs/tutorials/DRAGONS.md (step 7). The Dragons sample is
  // fixed data, so the counts are exact.
  describe("tutorial queries", () => {
    const rule = (field, operator, value = null) => ({ field, operator, value });
    const ownsBlackDragon = [rule("Person", "Own", "Dragon"), rule("Dragon.color", "=", "BLACK")];
    const count = async (rules, lang) => {
      const query = { combinator: "and", rules };
      const result = lang === "v1"
        ? await fuse.runV1(queryToV1(query, ontology, { ont: "Dragons" }), { pageSize: 100 })
        : await fuse.runCypher(queryToCypher(query, ontology), { ontology: "Dragons", pageSize: 100 });
      track(result);
      return result.actualPageSize;
    };

    test("people who own a black dragon: 11, in both languages", async () => {
      expect(await count(ownsBlackDragon, "cypher")).toBe(11);
      expect(await count(ownsBlackDragon, "v1")).toBe(11);
    });

    test("... who are women: 3", async () => {
      expect(await count([...ownsBlackDragon, rule("Person.gender", "=", "FEMALE")], "cypher")).toBe(3);
    });

    test("... whose first name contains e: fails in Cypher, 6 in V1", async () => {
      const rules = [...ownsBlackDragon, rule("Person.firstName", "contains", "e")];
      await expect(count(rules, "cypher")).rejects.toThrow(/contains not supported/);
      expect(await count(rules, "v1")).toBe(6);
    });

    test("black dragons: 121 over two pages", async () => {
      const first = track(await fuse.runCypher("MATCH (d:Dragon) WHERE d.color = 'BLACK' RETURN d", { ontology: "Dragons", pageSize: 100 }));
      expect(first.actualPageSize).toBe(100);
      expect(first.hasMore).toBe(true);
      const next = await fuse.nextPage(first.queryId, first.cursorId, 100);
      expect(next.actualPageSize).toBe(21);
      expect(next.hasMore).toBe(false);
    });
  });

  describe("every Dragons template", () => {
    const report = [];
    afterAll(() => {
      // Printed so the pass/fail table in docs/UX_AND_FUSE_PLAN.md can be refreshed.
      console.log(["template | cypher | v1", ...report].join("\n"));
    });

    templates.dragons.forEach((template, i) => {
      test(`#${i} ${template.description}: Cypher and V1 both return results`, async () => {
        const cypher = queryToCypher(template.query, ontology);
        const v1 = queryToV1(template.query, ontology, { ont: "Dragons" });
        const c = track(await fuse.runCypher(cypher, { ontology: "Dragons", pageSize: 100 }));
        const v = track(await fuse.runV1(v1, { pageSize: 100 }));
        report.push(`#${i} | ${c.actualPageSize} | ${v.actualPageSize}`);
        expect(c.actualPageSize).toBeGreaterThan(0);
        expect(v.actualPageSize).toBeGreaterThan(0);
      });
    });
  });
});

if (!FUSE_URL) {
  test("Fuse integration tests are skipped (set FUSE_URL to run them)", () => {});
}
