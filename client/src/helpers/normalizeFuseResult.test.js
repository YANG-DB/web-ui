import normalizeFuseResult, {
  appendFuseResult,
  qualifiedId,
  resolveOntologyId
} from "./normalizeFuseResult";
import extractResults from "./extractResults";

// Shaped like a Fuse 0.9.1 page for `MATCH (p:Person)-[o:Own]-(d:Dragon) RETURN *`,
// where Person 1 and Dragon 1 share the raw id "1".
function page() {
  return {
    queryId: "q1",
    cursorId: "1",
    pattern: { ont: "Dragons", name: "q1" },
    resultType: "assignments",
    assignments: [
      {
        entities: [
          { eTag: ["p"], eType: "Person", id: "1", tag: "p", properties: [] },
          { eTag: ["d"], eType: "Dragon", id: "1", tag: "d", properties: [] }
        ],
        relationships: [
          { rID: "Own:dragon_1_1", rType: "Own", eID1: "1", eID2: "1", eTag1: "p", eTag2: "d", properties: [] }
        ]
      }
    ]
  };
}

test("qualifies entity ids by type so equal raw ids do not collide", () => {
  const result = normalizeFuseResult(page());
  const [person, dragon] = result.data.assignments[0].entities;
  expect(person.eID).toBe("Person_1");
  expect(dragon.eID).toBe("Dragon_1");
  expect(person.id).toBe("1");
});

test("qualifies relationship ends through their tags", () => {
  const rel = normalizeFuseResult(page()).data.assignments[0].relationships[0];
  expect(rel.eID1).toBe("Person_1");
  expect(rel.eID2).toBe("Dragon_1");
});

test("falls back to the only entity with that id when the tag is unknown", () => {
  const p = page();
  p.assignments[0].entities = [{ eTag: ["neighbor.Dragon"], eType: "Dragon", id: "7" }];
  p.assignments[0].relationships = [{ rID: "r", eID1: "7", eID2: "8", eTag1: "x", eTag2: "y" }];
  const rel = normalizeFuseResult(p).data.assignments[0].relationships[0];
  expect(rel.eID1).toBe("Dragon_7");
  expect(rel.eID2).toBe("8");
});

test("keeps an existing eID", () => {
  const p = page();
  p.assignments[0].entities = [{ eID: "e1.default", eType: "Entity", eTag: ["A"] }];
  p.assignments[0].relationships = [{ rID: "r", eID1: "e1.default", eID2: "e2.default", eTag1: "A" }];
  const a = normalizeFuseResult(p).data.assignments[0];
  expect(a.entities[0].eID).toBe("e1.default");
  expect(a.relationships[0].eID1).toBe("e1.default");
});

test("an empty page (no assignments key) gives an empty result", () => {
  const result = normalizeFuseResult({ queryId: "q", pattern: { ont: "Dragons" } });
  expect(result.data.assignments).toEqual([]);
  expect(extractResults(result)).toEqual({ entities: [], relationships: [] });
  expect(normalizeFuseResult(null).data).toEqual({ pattern: {}, assignments: [] });
});

test("the result works with extractResults", () => {
  const r = extractResults(normalizeFuseResult(page()));
  expect(r.entities.map(e => e.eID)).toEqual(["Person_1", "Dragon_1"]);
  expect(r.relationships).toHaveLength(1);
});

test("does not mutate the input", () => {
  const p = page();
  normalizeFuseResult(p);
  expect(p.assignments[0].entities[0].eID).toBeUndefined();
});

test("appendFuseResult adds the next page's assignments", () => {
  const first = normalizeFuseResult(page());
  const merged = appendFuseResult(first, page());
  expect(merged.data.assignments).toHaveLength(2);
  expect(first.data.assignments).toHaveLength(1);
  expect(qualifiedId("Kingdom", 5)).toBe("Kingdom_5");
});

test("resolveOntologyId ignores case", () => {
  expect(resolveOntologyId(["Dragons", "Knowledge"], "dragons")).toBe("Dragons");
  expect(resolveOntologyId(["dragons", "Dragons"], "Dragons")).toBe("Dragons");
  expect(resolveOntologyId(["Dragons"], "flights")).toBeNull();
  expect(resolveOntologyId(undefined, "x")).toBeNull();
  expect(resolveOntologyId(["Dragons"], "")).toBeNull();
});
