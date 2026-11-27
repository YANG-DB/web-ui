// Converts a react-querybuilder query into Cypher that YangDB (Fuse) accepts.
//
// Fuse specifics (yang-db docs/revival/KNOWN_ISSUES.md and tests against 0.9.1):
//  - relationship types are matched by their exact ontology name (`Own`, not `OWN`);
//  - every variable needs a label, an unbound variable in WHERE is silently ignored;
//  - cyclic patterns are not supported (see analyzeQuery for how variables are chosen);
//  - CONTAINS is not supported by Fuse's Cypher (the query fails with a Fuse error);
//    the V1 generator (queryToV1) supports it.
import analyzeQuery from "./analyzeQuery";

export function quote(value) {
  const text = value == null ? "" : String(value);
  return `'${text.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

function isNumeric(value) {
  return value !== null && value !== "" && !isNaN(Number(value));
}

function renderCondition({ varName, property, operator, value }) {
  const ref = `${varName}.${property}`;
  switch (operator) {
    case "=":
      return `${ref} = ${quote(value)}`;
    case "!=":
      return `${ref} <> ${quote(value)}`;
    case "contains":
      return `${ref} CONTAINS ${quote(value)}`;
    case "beginsWith":
      return `${ref} STARTS WITH ${quote(value)}`;
    case "endsWith":
      return `${ref} ENDS WITH ${quote(value)}`;
    case "<":
    case ">":
    case "<=":
    case ">=":
      return `${ref} ${operator} ${isNumeric(value) ? Number(value) : quote(value)}`;
    case "null":
      return `${ref} IS NULL`;
    case "notNull":
      return `${ref} IS NOT NULL`;
    default:
      return `${ref} ${operator} ${quote(value)}`;
  }
}

function renderWhere(node) {
  if (!node) return null;
  if (node.kind === "cond") return renderCondition(node);
  return `(${node.children.map(renderWhere).join(` ${node.combinator.toUpperCase()} `)})`;
}

export default function queryToCypher(query, ontology) {
  const { variables, patterns, conditions } = analyzeQuery(query, ontology);
  if (variables.length === 0) {
    return "MATCH (n)\nRETURN n";
  }

  const inPattern = new Set();
  patterns.forEach(p => {
    inPattern.add(p.sourceVar);
    inPattern.add(p.targetVar);
  });
  const matchParts = patterns.map(
    p => `(${p.sourceVar}:${p.sourceType})-[${p.relVar}:${p.relType}]->(${p.targetVar}:${p.targetType})`
  );
  variables
    .filter(v => !inPattern.has(v.name))
    .forEach(v => matchParts.push(`(${v.name}:${v.type})`));

  const returnVars = [];
  patterns.forEach(p => {
    [p.sourceVar, p.relVar, p.targetVar].forEach(v => {
      if (!returnVars.includes(v)) returnVars.push(v);
    });
  });
  variables.forEach(v => {
    if (!returnVars.includes(v.name)) returnVars.push(v.name);
  });

  const where = renderWhere(conditions);
  return `MATCH ${matchParts.join(", ")}${where ? `\nWHERE ${where}` : ""}\nRETURN ${returnVars.join(", ")}`;
}
