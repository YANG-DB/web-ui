import queryToV1, { V1UnsupportedError } from "./queryToV1";
import templates from "../constants/queryTemplates";
import dragonsOntology from "../../../mocks/ontology/dragons/ontology.json";

const rule = (field, operator, value = null) => ({ field, operator, value });
const and = (...rules) => ({ combinator: "and", rules });
const or = (...rules) => ({ combinator: "or", rules });

describe("queryToV1", () => {
  test("one entity with one condition", () => {
    expect(queryToV1(and(rule("Dragon.color", "=", "BLACK")), dragonsOntology)).toEqual({
      name: "web-ui",
      ont: "Dragons",
      elements: [
        { eNum: 0, type: "Start", next: 1 },
        { eNum: 1, type: "ETyped", eTag: "d", eType: "Dragon", next: 2 },
        { eNum: 2, type: "EProp", pType: "color", con: { type: "Constraint", op: "eq", expr: "BLACK" } }
      ]
    });
  });

  test("an entity with no conditions has no next", () => {
    const q = queryToV1(and(rule("Person", "Own", "Dragon")), dragonsOntology, { ont: "Dragons" });
    expect(q.elements).toEqual([
      { eNum: 0, type: "Start", next: 1 },
      { eNum: 1, type: "ETyped", eTag: "p", eType: "Person", next: 2 },
      { eNum: 2, type: "Rel", rType: "Own", dir: "R", next: 3 },
      { eNum: 3, type: "ETyped", eTag: "d", eType: "Dragon" }
    ]);
  });

  test("OR on one entity becomes an EPropGroup with quantType some", () => {
    const q = queryToV1(or(rule("Dragon.color", "=", "RED"), rule("Dragon.color", "=", "BLUE")), dragonsOntology);
    expect(q.elements[2]).toEqual({
      eNum: 2,
      type: "EPropGroup",
      quantType: "some",
      props: [
        { eNum: 3, type: "EProp", pType: "color", con: { type: "Constraint", op: "eq", expr: "RED" } },
        { eNum: 4, type: "EProp", pType: "color", con: { type: "Constraint", op: "eq", expr: "BLUE" } }
      ],
      groups: []
    });
  });

  test("a condition and a relationship branch through Quant1", () => {
    const q = queryToV1(
      and(rule("Person.gender", "=", "FEMALE"), rule("Person", "Own", "Dragon"), rule("Dragon.color", "=", "BLACK")),
      dragonsOntology
    );
    expect(q.elements.map(e => [e.eNum, e.type, e.next])).toEqual([
      [0, "Start", 1],
      [1, "ETyped", 2],
      [2, "Quant1", [3, 4]],
      [3, "EProp", undefined],
      [4, "Rel", 5],
      [5, "ETyped", 6],
      [6, "EProp", undefined]
    ]);
  });

  test("numbers are typed from the ontology, wildcards replace contains", () => {
    const q = queryToV1(
      and(rule("Kingdom.funds", ">", "1000"), rule("Kingdom.name", "contains", "land")),
      dragonsOntology
    );
    const props = q.elements[2].props;
    expect(props[0].con).toEqual({ type: "Constraint", op: "gt", expr: 1000 });
    expect(props[1].con).toEqual({ type: "Constraint", op: "like", expr: "*land*" });
  });

  test("operator mapping", () => {
    const con = (op, value) => queryToV1(and(rule("Person.firstName", op, value)), dragonsOntology).elements[2].con;
    expect(con("notNull")).toEqual({ type: "Constraint", op: "not empty" });
    expect(con("null")).toEqual({ type: "Constraint", op: "empty" });
    expect(con("!=", "x").op).toBe("ne");
    expect(con("beginsWith", "Ch").expr).toBe("Ch*");
    expect(con("endsWith", "na").expr).toBe("*na");
    expect(con("doesNotContain", "x")).toEqual({ type: "Constraint", op: "not like", expr: "*x*" });
    expect(con("in", "A, B")).toEqual({ type: "Constraint", op: "in set", expr: ["A", "B"] });
    expect(con("notIn", ["A"]).op).toBe("not in set");
    expect(con("<", "5").op).toBe("lt");
    expect(con("<=", "5").op).toBe("le");
    expect(con(">=", "5").op).toBe("ge");
    expect(
      queryToV1(and(rule("Person.height", "between", "150,180")), dragonsOntology).elements[2].con
    ).toEqual({ type: "Constraint", op: "in range", expr: [150, 180] });
    expect(queryToV1(and(rule("Person.height", "notBetween", "1,2")), dragonsOntology).elements[2].con.op).toBe(
      "not in range"
    );
    expect(() => queryToV1(and(rule("Person.firstName", "regex", "x")), dragonsOntology)).toThrow(V1UnsupportedError);
  });

  test("nested groups keep their quantifier", () => {
    const q = queryToV1(
      and(rule("Person.firstName", "notNull"), or(rule("Person.gender", "=", "MALE"), rule("Person.gender", "=", "FEMALE"))),
      dragonsOntology
    );
    const group = q.elements[2];
    expect(group.quantType).toBe("all");
    expect(group.props).toHaveLength(1);
    expect(group.groups[0].quantType).toBe("some");
    expect(group.groups[0].props).toHaveLength(2);
    const nums = [group.eNum, ...group.props.map(p => p.eNum), group.groups[0].eNum, ...group.groups[0].props.map(p => p.eNum)];
    expect(new Set(nums).size).toBe(nums.length);
  });

  test("a relationship walked from its target points left", () => {
    const q = queryToV1(
      and(rule("Kingdom.funds", ">", "0"), rule("Horse", "OriginatedIn", "Kingdom")),
      dragonsOntology
    );
    expect(q.elements[1]).toMatchObject({ type: "ETyped", eType: "Kingdom" });
    expect(q.elements.find(e => e.type === "Rel")).toMatchObject({ rType: "OriginatedIn", dir: "L" });
  });

  test("OR across entities is unsupported", () => {
    expect(() =>
      queryToV1(
        and(rule("Person", "Own", "Dragon"), or(rule("Person.gender", "=", "MALE"), rule("Dragon.color", "=", "RED"))),
        dragonsOntology
      )
    ).toThrow(/different entities/);
  });

  test("disconnected patterns are unsupported", () => {
    expect(() =>
      queryToV1(and(rule("Person", "Own", "Horse"), rule("Dragon", "Fire", "Dragon")), dragonsOntology)
    ).toThrow(/connected/);
  });

  test("cycles are unsupported", () => {
    expect(() =>
      queryToV1(and(rule("Person", "Own", "Dragon"), rule("Person", "Own", "Dragon")), dragonsOntology)
    ).toThrow(/cycles/);
  });

  test("an empty query is unsupported", () => {
    expect(() => queryToV1(and(), dragonsOntology)).toThrow(V1UnsupportedError);
  });

  test("uses the given ontology id and name", () => {
    const q = queryToV1(and(rule("Dragon.color", "=", "RED")), dragonsOntology.data[0], { ont: "Dragons2", name: "x" });
    expect(q.ont).toBe("Dragons2");
    expect(q.name).toBe("x");
  });
});

describe("every Dragons template", () => {
  templates.dragons.forEach((template, i) => {
    test(`#${i}: ${template.description}`, () => {
      expect(queryToV1(template.query, dragonsOntology)).toMatchSnapshot();
    });
  });
});
