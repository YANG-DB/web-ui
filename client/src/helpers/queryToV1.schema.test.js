// Every V1 query web-ui generates must match YangDB's V1 query JSON Schema
// (vendored in src/spec/v1, see its README for the source and version).
import Ajv2020 from "ajv8/dist/2020";
import schema from "../spec/v1/query.schema.json";
import queryToV1, { V1UnsupportedError } from "./queryToV1";
import templates from "../constants/queryTemplates";
import dragonsOntology from "../../../mocks/ontology/dragons/ontology.json";

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

function expectValid(query) {
  const valid = validate(query);
  // Show the schema errors, not just "expected true".
  expect(valid ? [] : validate.errors.map(e => `${e.instancePath || "/"} ${e.message}`)).toEqual([]);
}

const rule = (field, operator, value = null) => ({ field, operator, value });
const and = (...rules) => ({ combinator: "and", rules });
const or = (...rules) => ({ combinator: "or", rules });

describe("V1 schema", () => {
  test("rejects a query that is not V1 (sanity check of the schema itself)", () => {
    expect(validate({ ont: "Dragons", elements: [{ eNum: 0, type: "Start", next: 1 }, { eNum: 1, type: "Nope" }] })).toBe(false);
    expect(validate({ elements: [] })).toBe(false);
  });

  describe("every Dragons template", () => {
    templates.dragons.forEach((template, i) => {
      test(`#${i}: ${template.description}`, () => {
        expectValid(queryToV1(template.query, dragonsOntology, { ont: "Dragons" }));
      });
    });
  });

  // Every operator queryToV1 maps, on a field of the right type.
  const operators = [
    ["Person.firstName", "=", "Christiana"],
    ["Person.firstName", "!=", "Christiana"],
    ["Person.height", "<", "170"],
    ["Person.height", ">", "170"],
    ["Person.height", "<=", "170"],
    ["Person.height", ">=", "170"],
    ["Person.firstName", "contains", "e"],
    ["Person.firstName", "beginsWith", "Ch"],
    ["Person.firstName", "endsWith", "na"],
    ["Person.firstName", "null", null],
    ["Person.firstName", "notNull", null],
    ["Person.gender", "in", "MALE,FEMALE"],
    ["Person.gender", "notIn", "MALE"],
    ["Person.height", "between", "150,180"],
    ["Person.height", "notBetween", "150,180"]
  ];
  test.each(operators)("%s %s %s", (field, operator, value) => {
    expectValid(queryToV1(and(rule(field, operator, value)), dragonsOntology));
  });

  test("operators queryToV1 refuses are not sent at all", () => {
    expect(() => queryToV1(and(rule("Person.firstName", "doesNotContain", "e")), dragonsOntology)).toThrow(
      V1UnsupportedError
    );
  });

  test("shapes: groups, quantifiers, both relationship directions", () => {
    const cases = [
      // OR on one entity -> EPropGroup some
      or(rule("Dragon.color", "=", "RED"), rule("Dragon.color", "=", "BLUE")),
      // nested groups
      and(rule("Person.firstName", "notNull"), or(rule("Person.gender", "=", "MALE"), rule("Person.gender", "=", "FEMALE"))),
      // condition plus relationship -> Quant1
      and(rule("Person.gender", "=", "FEMALE"), rule("Person", "Own", "Dragon"), rule("Dragon.color", "=", "BLACK")),
      // relationship walked from its target -> dir L
      and(rule("Kingdom.funds", ">", "0"), rule("Horse", "OriginatedIn", "Kingdom")),
      // same-type relationship
      and(rule("Person", "Know", "Person"), rule("Person.firstName", "=", "Christiana")),
      // the tutorial's text match
      and(rule("Person", "Own", "Dragon"), rule("Dragon.color", "=", "BLACK"), rule("Person.firstName", "contains", "e"))
    ];
    cases.forEach(query => expectValid(queryToV1(query, dragonsOntology)));
  });
});
