// Converts a react-querybuilder query into a YangDB (Fuse) V1 query, the JSON query
// language Fuse runs natively (`POST /fuse/query/v1/run`). See yang-db
// docs/info/components/query_language.md.
//
// A V1 query is a tree of elements linked by `next`:
//   Start -> ETyped (entity) -> [Quant1 when it branches] -> EProp / EPropGroup / Rel -> ETyped ...
//
// Limits, which throw a V1UnsupportedError so the caller can say so (or use Cypher):
//  - an OR across conditions on different entities (V1 groups belong to one entity);
//  - patterns that are disconnected or cyclic (V1 queries are trees).
import analyzeQuery from "./analyzeQuery";

export class V1UnsupportedError extends Error {
  constructor(message) {
    super(message);
    this.name = "V1UnsupportedError";
  }
}

// builder operator -> V1 constraint op. Every op used here is allowed by the V1 query
// schema (yang-db docs/spec/v1/query.schema.json) and was run against Fuse 0.9.1:
// `contains` is not supported there, `like` with wildcards is. No negative text op works
// on 0.9.1 (`not contains`, `not match` are "not supported"; there is no `not like`), so
// "does not contain" falls through to V1UnsupportedError.
function constraintFor(operator, value, toExpr) {
  const text = value == null ? "" : String(value);
  const list = () =>
    (Array.isArray(value) ? value : text.split(","))
      .map(v => String(v).trim())
      .filter(v => v !== "")
      .map(toExpr);
  switch (operator) {
    case "=":
      return { op: "eq", expr: toExpr(value) };
    case "!=":
      return { op: "ne", expr: toExpr(value) };
    case "<":
      return { op: "lt", expr: toExpr(value) };
    case ">":
      return { op: "gt", expr: toExpr(value) };
    case "<=":
      return { op: "le", expr: toExpr(value) };
    case ">=":
      return { op: "ge", expr: toExpr(value) };
    case "contains":
      return { op: "like", expr: `*${text}*` };
    case "beginsWith":
      return { op: "like", expr: `${text}*` };
    case "endsWith":
      return { op: "like", expr: `*${text}` };
    case "null":
      return { op: "empty" };
    case "notNull":
      return { op: "not empty" };
    case "in":
      return { op: "in set", expr: list() };
    case "notIn":
      return { op: "not in set", expr: list() };
    case "between":
      return { op: "in range", expr: list() };
    case "notBetween":
      return { op: "not in range", expr: list() };
    default:
      throw new V1UnsupportedError(`V1 has no operator for "${operator}"`);
  }
}

// Collects each entity variable's conditions as a property-group tree:
// {quantType: "all" | "some", props: [cond], groups: [group]}.
function groupByVariable(node) {
  if (!node) return {};
  if (node.kind === "cond") {
    return { [node.varName]: { quantType: "all", props: [node], groups: [] } };
  }

  const childMaps = node.children.map(groupByVariable);
  const vars = [];
  childMaps.forEach(m =>
    Object.keys(m).forEach(v => {
      if (!vars.includes(v)) vars.push(v);
    })
  );

  const quantType = node.combinator === "or" ? "some" : "all";
  if (quantType === "some" && vars.length > 1) {
    throw new V1UnsupportedError(
      `V1 cannot combine conditions on different entities (${vars.join(", ")}) with OR. Use Cypher for this query.`
    );
  }

  const result = {};
  vars.forEach(v => {
    const group = { quantType, props: [], groups: [] };
    childMaps.forEach(m => {
      const child = m[v];
      if (!child) return;
      if (child.quantType === quantType || (child.props.length + child.groups.length === 1)) {
        group.props.push(...child.props);
        group.groups.push(...child.groups);
      } else {
        group.groups.push(child);
      }
    });
    result[v] = group;
  });
  return result;
}

export default function queryToV1(query, ontology, { ont, name = "web-ui" } = {}) {
  const analysis = analyzeQuery(query, ontology);
  const { variables, patterns, conditions } = analysis;
  const ontologyObject = analysis.ontology;
  const ontId = ont || (ontologyObject && ontologyObject.ont) || null;

  if (variables.length === 0) {
    throw new V1UnsupportedError("Add at least one entity to the query.");
  }

  const propTypes = {};
  ((ontologyObject && ontologyObject.properties) || []).forEach(p => {
    propTypes[p.pType] = typeof p.type === "string" ? p.type : p.type && p.type.type;
  });
  const exprFor = property => value => {
    const type = propTypes[property];
    if ((type === "int" || type === "float" || type === "long") && value !== "" && value != null && !isNaN(Number(value))) {
      return Number(value);
    }
    return value == null ? value : String(value);
  };

  const groups = groupByVariable(conditions);
  const typeOf = {};
  variables.forEach(v => {
    typeOf[v.name] = v.type;
  });

  const elements = [{ eNum: 0, type: "Start", next: 1 }];
  let counter = 1;
  const nextNum = () => counter++;

  const eprop = (cond, eNum = nextNum()) => {
    const con = { type: "Constraint", ...constraintFor(cond.operator, cond.value, exprFor(cond.property)) };
    return { eNum, type: "EProp", pType: cond.property, con };
  };
  const epropGroup = (group, eNum = nextNum()) => ({
    eNum,
    type: "EPropGroup",
    quantType: group.quantType,
    props: group.props.map(cond => eprop(cond)),
    groups: group.groups.map(g => epropGroup(g))
  });

  const visited = new Set();
  const usedPatterns = new Set();

  const emitEntity = (varName, eNum) => {
    visited.add(varName);
    const entity = { eNum, type: "ETyped", eTag: varName, eType: typeOf[varName] };
    elements.push(entity);

    const branches = []; // functions that emit a branch at a given eNum
    const group = groups[varName];
    if (group && group.props.length + group.groups.length > 0) {
      branches.push(num => {
        elements.push(
          group.props.length === 1 && group.groups.length === 0
            ? eprop(group.props[0], num)
            : epropGroup(group, num)
        );
      });
    }

    patterns.forEach((p, i) => {
      if (usedPatterns.has(i)) return;
      const isSource = p.sourceVar === varName;
      const isTarget = p.targetVar === varName;
      if (!isSource && !isTarget) return;
      const other = isSource ? p.targetVar : p.sourceVar;
      if (visited.has(other)) {
        throw new V1UnsupportedError("V1 queries cannot contain cycles. Use Cypher for this query.");
      }
      usedPatterns.add(i);
      visited.add(other);
      branches.push(num => {
        const rel = { eNum: num, type: "Rel", rType: p.relType, dir: isSource ? "R" : "L", next: 0 };
        elements.push(rel);
        rel.next = nextNum();
        emitEntity(other, rel.next);
      });
    });

    if (branches.length === 1) {
      entity.next = nextNum();
      branches[0](entity.next);
    } else if (branches.length > 1) {
      const quant = { eNum: nextNum(), type: "Quant1", qType: "all", next: [] };
      entity.next = quant.eNum;
      elements.push(quant);
      const nums = branches.map(() => nextNum());
      quant.next = nums;
      branches.forEach((emit, i) => emit(nums[i]));
    }
  };

  emitEntity(variables[0].name, nextNum());

  const unreached = variables.filter(v => !visited.has(v.name)).map(v => v.name);
  if (unreached.length > 0) {
    throw new V1UnsupportedError(
      `Every entity must be connected to the first one (${unreached.join(", ")} are not). Use Cypher for this query.`
    );
  }

  elements.sort((a, b) => a.eNum - b.eNum);
  return { name, ont: ontId, elements };
}
