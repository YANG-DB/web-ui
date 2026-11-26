// Reads a react-querybuilder query against an ontology and returns a small graph model
// that both query generators (queryToCypher, queryToV1) render from:
//
//   variables:  [{name, type}]               typed entities, in order of first use
//   patterns:   [{sourceVar, sourceType, relVar, relType, targetVar, targetType}]
//   conditions: null | {kind: "cond", varName, entityType, property, operator, value}
//                    | {kind: "group", combinator: "and" | "or", children: [...]}
//
// Rule kinds:
//  - relationship: {field: "Person", operator: "Own", value: "Dragon"}, `operator` is an
//    ontology rType. If `value` is not an entity type, the first valid target is used.
//  - property: {field: "Dragon.color", operator: "=", value: "BLACK"}.
//
// Variables: a property condition attaches to the most recent variable of its type. The
// target of a same-type relationship (Person Know Person) gets a new variable, because
// Fuse does not support cyclic patterns.

export function getOntologyObject(ontology) {
  if (!ontology) return null;
  if (ontology.data && Array.isArray(ontology.data)) return ontology.data[0] || null;
  return ontology;
}

export default function analyzeQuery(query, ontology) {
  const ont = getOntologyObject(ontology);
  const relationshipTypes = (ont && ont.relationshipTypes) || [];
  const entityTypes = (ont && ont.entityTypes) || [];

  const variables = [];
  const lastVarByType = {};
  const usedNames = new Set();
  const patterns = [];

  const newVar = type => {
    const base = type.toLowerCase().charAt(0) || "n";
    let name = base;
    let i = 1;
    while (usedNames.has(name)) name = `${base}${i++}`;
    usedNames.add(name);
    variables.push({ name, type });
    lastVarByType[type] = name;
    return name;
  };
  const varFor = type => lastVarByType[type] || newVar(type);

  const relationshipRule = rule => {
    if (!ont || !rule.operator) return false;
    const relationship = relationshipTypes.find(r => r.rType === rule.operator);
    if (!relationship) return false;

    const sourceType = rule.field;
    let targetType = rule.value;
    if (!targetType || !entityTypes.some(e => e.eType === targetType)) {
      const validTargets = (relationship.ePairs || [])
        .filter(pair => pair.eTypeA === sourceType)
        .map(pair => pair.eTypeB);
      if (validTargets.length > 0) targetType = validTargets[0];
    }
    if (!targetType) return false;

    const sourceVar = varFor(sourceType);
    const targetVar = targetType === sourceType ? newVar(targetType) : varFor(targetType);
    patterns.push({
      sourceVar,
      sourceType,
      relVar: `r${patterns.length}`,
      relType: relationship.rType,
      targetVar,
      targetType
    });
    return true;
  };

  const walk = rule => {
    if (!rule) return null;
    if (Array.isArray(rule.rules)) {
      const children = rule.rules.map(walk).filter(Boolean);
      if (children.length === 0) return null;
      if (children.length === 1) return children[0];
      return { kind: "group", combinator: (rule.combinator || "and").toLowerCase(), children };
    }
    if (relationshipRule(rule)) return null;

    const parts = (rule.field || "").split(".");
    if (parts.length !== 2) return null;
    const [entityType, property] = parts;
    return {
      kind: "cond",
      varName: varFor(entityType),
      entityType,
      property,
      operator: rule.operator,
      value: rule.value
    };
  };

  const conditions = walk(query);
  return { ontology: ont, variables, patterns, conditions };
}
