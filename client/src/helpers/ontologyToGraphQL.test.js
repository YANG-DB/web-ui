import convertOntologyToGraphQL from "./ontologyToGraphQL";
import dragons from "../../../mocks/ontology/dragons/ontology.json";
import linkedin from "../../../mocks/ontology/linkedin/ontology.json";
import flights from "../../../mocks/ontology/flights/ontology.json";

// Field names per `type X { ... }` / `input X { ... }` block of an SDL string.
function fieldsByBlock(sdl) {
  const blocks = {};
  const re = /^(type|input)\s+(\w+)\s*\{([\s\S]*?)^\}/gm;
  let m;
  while ((m = re.exec(sdl))) {
    const names = [];
    let depth = 0;
    m[3].split("\n").forEach(line => {
      const text = line.replace(/#.*/, "");
      if (depth === 0) {
        const field = text.match(/^\s*(\w+)\s*[:(]/);
        if (field) names.push(field[1]);
      }
      depth += (text.match(/\(/g) || []).length - (text.match(/\)/g) || []).length;
    });
    blocks[`${m[1]} ${m[2]}`] = names;
  }
  return blocks;
}

function duplicates(sdl) {
  return Object.entries(fieldsByBlock(sdl))
    .map(([block, names]) => [block, names.filter((n, i) => names.indexOf(n) !== i)])
    .filter(([, dups]) => dups.length > 0);
}

// The Dragons ontology as Fuse serves it adds Profession and HasProfession, whose only
// property is called "type".
const fuseDragons = JSON.parse(JSON.stringify(dragons));
fuseDragons.data[0].entityTypes.push({ eType: "Profession", name: "Profession", properties: ["name", "experience", "certification", "salary"], metadata: ["id"] });
fuseDragons.data[0].relationshipTypes.push({
  rType: "HasProfession",
  name: "HasProfession",
  directional: true,
  ePairs: [{ eTypeA: "Person", eTypeB: "Profession" }],
  properties: ["type"],
  metadata: ["id"]
});

test.each([
  ["Dragons (mock)", dragons],
  ["Dragons (as Fuse serves it)", fuseDragons],
  ["LinkedIn", linkedin],
  ["Flights", flights]
])("%s: no type or input defines a field twice", (name, ontology) => {
  const sdl = convertOntologyToGraphQL(ontology);
  expect(Object.keys(fieldsByBlock(sdl)).length).toBeGreaterThan(3);
  expect(duplicates(sdl)).toEqual([]);
});

test("a relationship property named 'type' does not repeat the type field", () => {
  const sdl = convertOntologyToGraphQL(fuseDragons);
  expect(fieldsByBlock(sdl)["type HasProfessionRelationship"]).toEqual(["type"]);
});
