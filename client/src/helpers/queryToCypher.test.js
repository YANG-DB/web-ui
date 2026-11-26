import queryToCypher, { quote } from "./queryToCypher";
import templates from "../constants/queryTemplates";
import dragonsOntology from "../../../mocks/ontology/dragons/ontology.json";
import linkedinOntology from "../../../mocks/ontology/linkedin/ontology.json";
import flightsOntology from "../../../mocks/ontology/flights/ontology.json";

const ontologies = {
  dragons: dragonsOntology,
  linkedin: linkedinOntology,
  flights: flightsOntology
};

describe("queryToCypher", () => {
  test("empty query", () => {
    expect(queryToCypher({ combinator: "and", rules: [] }, dragonsOntology)).toBe(
      "MATCH (n)\nRETURN n"
    );
  });

  test("a property condition binds a labelled variable", () => {
    expect(
      queryToCypher(
        { combinator: "and", rules: [{ field: "Person.firstName", operator: "notNull", value: null }] },
        dragonsOntology
      )
    ).toBe("MATCH (p:Person)\nWHERE p.firstName IS NOT NULL\nRETURN p");
  });

  test("relationship types keep their ontology casing", () => {
    expect(
      queryToCypher(
        { combinator: "and", rules: [{ field: "Person", operator: "Own", value: "Dragon" }] },
        dragonsOntology
      )
    ).toBe("MATCH (p:Person)-[r0:Own]->(d:Dragon)\nRETURN p, r0, d");
  });

  test("a same-type relationship gets two variables, conditions go to the target", () => {
    expect(
      queryToCypher(
        {
          combinator: "and",
          rules: [
            { field: "Person", operator: "Know", value: "Person" },
            { field: "Person.firstName", operator: "=", value: "George" }
          ]
        },
        dragonsOntology
      )
    ).toBe("MATCH (p:Person)-[r0:Know]->(p1:Person)\nWHERE p1.firstName = 'George'\nRETURN p, r0, p1");
  });

  test("infers the target type when the value is not an entity type", () => {
    expect(
      queryToCypher(
        { combinator: "and", rules: [{ field: "Person", operator: "MemberOf", value: "1" }] },
        dragonsOntology
      )
    ).toBe("MATCH (p:Person)-[r0:MemberOf]->(g:Guild)\nRETURN p, r0, g");
  });

  test("numbers stay bare in comparisons, strings are quoted and escaped", () => {
    expect(
      queryToCypher(
        {
          combinator: "or",
          rules: [
            { field: "Kingdom.funds", operator: ">", value: "1000" },
            { field: "Kingdom.name", operator: "=", value: "O'Hara" }
          ]
        },
        dragonsOntology
      )
    ).toBe("MATCH (k:Kingdom)\nWHERE (k.funds > 1000 OR k.name = 'O\\'Hara')\nRETURN k");
  });

  test("accepts the bare ontology object as well as the {data: [...]} envelope", () => {
    const query = { combinator: "and", rules: [{ field: "Person", operator: "Own", value: "Horse" }] };
    expect(queryToCypher(query, dragonsOntology.data[0])).toBe(queryToCypher(query, dragonsOntology));
  });

  test("without an ontology, relationship rules are skipped", () => {
    expect(
      queryToCypher({ combinator: "and", rules: [{ field: "Person", operator: "Own", value: "Dragon" }] }, null)
    ).toBe("MATCH (n)\nRETURN n");
  });

  test("quote", () => {
    expect(quote(null)).toBe("''");
    expect(quote("a\\b")).toBe("'a\\\\b'");
  });
});

describe("every template", () => {
  Object.keys(templates).forEach(ontologyType => {
    templates[ontologyType].forEach((template, i) => {
      test(`${ontologyType} #${i}: ${template.description}`, () => {
        expect(queryToCypher(template.query, ontologies[ontologyType])).toMatchSnapshot();
      });
    });
  });
});
