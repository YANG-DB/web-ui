import extractResults from "./extractResults";

const entity = id => ({ eID: id, eType: "Person", properties: [] });
const rel = (id, a, b) => ({ rID: id, eID1: a, eID2: b });

test("merges entities and relationships across assignments, recording where each appears", () => {
  const r = extractResults({
    data: {
      assignments: [
        { entities: [entity("a"), entity("b")], relationships: [rel("r1", "a", "b")] },
        { entities: [entity("a"), entity("c")], relationships: [rel("r1", "a", "b"), rel("r2", "a", "c")] }
      ]
    }
  });
  expect(r.entities.map(e => [e.eID, e.assignments])).toEqual([
    ["a", [0, 1]],
    ["b", [0]],
    ["c", [1]]
  ]);
  expect(r.relationships.map(x => [x.rID, x.assignments])).toEqual([
    ["r1", [0, 1]],
    ["r2", [1]]
  ]);
});

test("an empty result gives empty lists", () => {
  expect(extractResults({ data: { assignments: [] } })).toEqual({ entities: [], relationships: [] });
  expect(extractResults({ data: {} })).toEqual({ entities: [], relationships: [] });
  expect(extractResults(undefined)).toEqual({ entities: [], relationships: [] });
});

test("an assignment without relationships", () => {
  const r = extractResults({ data: { assignments: [{ entities: [entity("a")] }] } });
  expect(r.entities).toHaveLength(1);
  expect(r.relationships).toEqual([]);
});
