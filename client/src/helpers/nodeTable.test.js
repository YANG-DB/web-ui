import { buildNodeTable, matchesFilter, filterRows, FIXED_COLUMNS } from "./nodeTable";

const props = obj => Object.entries(obj).map(([pType, value]) => ({ pType, value }));
const nodes = [
  { id: "Person_61", type: "Person", name: "Christiana Schinner", rawId: "61", degree: 5, properties: props({ firstName: "Christiana", gender: "MALE", height: "181" }) },
  { id: "Dragon_1", type: "Dragon", name: "Dragon_1", rawId: "1", degree: 2, properties: props({ color: "BLUE", power: "12" }) },
  { id: "Person_15", type: "Person", name: "Pierce Wiza", rawId: "15", degree: 1, properties: props({ firstName: "Pierce", gender: "MALE", height: "175", color: ["a", "b"] }) }
];

describe("buildNodeTable", () => {
  const { columns, rows } = buildNodeTable(nodes);

  test("fixed columns first, then property names in order of first appearance", () => {
    expect(columns.map(c => c.label)).toEqual(["Type", "Name", "ID", "Relationships", "firstName", "gender", "height", "color", "power"]);
    expect(columns.slice(0, FIXED_COLUMNS.length)).toEqual(FIXED_COLUMNS);
    expect(columns[4]).toEqual({ key: "prop:firstName", label: "firstName", property: "firstName" });
  });

  test("one row per node, a string per column, blanks where a node lacks a property", () => {
    expect(rows.map(r => r.id)).toEqual(["Person_61", "Dragon_1", "Person_15"]);
    expect(rows[0].cells).toEqual({
      type: "Person", name: "Christiana Schinner", rawId: "61", degree: "5",
      "prop:firstName": "Christiana", "prop:gender": "MALE", "prop:height": "181", "prop:color": "", "prop:power": ""
    });
    expect(rows[2].cells["prop:color"]).toBe("a, b");
  });

  test("empty input", () => {
    expect(buildNodeTable([])).toEqual({ columns: FIXED_COLUMNS, rows: [] });
    expect(buildNodeTable(undefined).rows).toEqual([]);
  });
});

describe("matchesFilter", () => {
  test("case-insensitive substring", () => {
    expect(matchesFilter("Christiana Schinner", "schin")).toBe(true);
    expect(matchesFilter("Christiana Schinner", "wiza")).toBe(false);
    expect(matchesFilter("", "x")).toBe(false);
    expect(matchesFilter(null, "x")).toBe(false);
  });

  test("an empty filter matches everything", () => {
    expect(matchesFilter("anything", "")).toBe(true);
    expect(matchesFilter("anything", "   ")).toBe(true);
    expect(matchesFilter("anything", undefined)).toBe(true);
  });

  test("numeric comparisons", () => {
    expect(matchesFilter("5", ">3")).toBe(true);
    expect(matchesFilter("5", "> 5")).toBe(false);
    expect(matchesFilter("5", ">=5")).toBe(true);
    expect(matchesFilter("181", "<= 180")).toBe(false);
    expect(matchesFilter("12.5", "<13")).toBe(true);
    expect(matchesFilter("181", "=181")).toBe(true);
    expect(matchesFilter("-2", "< 0")).toBe(true);
  });

  test("a comparison never matches blank or non-numeric cells", () => {
    expect(matchesFilter("", ">0")).toBe(false);
    expect(matchesFilter("BLUE", ">0")).toBe(false);
  });

  test("text that only looks partly like a comparison is a substring search", () => {
    expect(matchesFilter("a > b", "> b")).toBe(true);
  });
});

describe("filterRows", () => {
  const { rows } = buildNodeTable(nodes);

  test("ANDs every non-empty filter", () => {
    expect(filterRows(rows, { type: "person" }).map(r => r.id)).toEqual(["Person_61", "Person_15"]);
    expect(filterRows(rows, { type: "person", degree: ">2" }).map(r => r.id)).toEqual(["Person_61"]);
    expect(filterRows(rows, { "prop:power": ">10", type: "" }).map(r => r.id)).toEqual(["Dragon_1"]);
  });

  test("no filters returns the rows unchanged", () => {
    expect(filterRows(rows, {})).toBe(rows);
    expect(filterRows(rows, { name: "  " })).toBe(rows);
    expect(filterRows(rows, undefined)).toBe(rows);
  });
});
