// Builds and filters the node table shown under the graph.
import { formatValue } from "./elementDetails";

export const FIXED_COLUMNS = [
  { key: "type", label: "Type" },
  { key: "name", label: "Name" },
  { key: "rawId", label: "ID" },
  { key: "degree", label: "Relationships", numeric: true }
];

// nodes: [{id, type, name, rawId, degree, properties: [{pType, value}]}]
// Returns {columns, rows}: the fixed columns, then one column per property name in order of
// first appearance; one row per node with a display string per column.
export function buildNodeTable(nodes) {
  const propertyNames = [];
  const seen = new Set();
  (nodes || []).forEach(node =>
    (node.properties || []).forEach(p => {
      if (p && p.pType && !seen.has(p.pType)) {
        seen.add(p.pType);
        propertyNames.push(p.pType);
      }
    })
  );

  const columns = [
    ...FIXED_COLUMNS,
    ...propertyNames.map(name => ({ key: `prop:${name}`, label: name, property: name }))
  ];

  const rows = (nodes || []).map(node => {
    const cells = {
      type: node.type == null ? "" : String(node.type),
      name: node.name == null ? "" : String(node.name),
      rawId: node.rawId == null ? "" : String(node.rawId),
      degree: node.degree == null ? "" : String(node.degree)
    };
    (node.properties || []).forEach(p => {
      if (p && p.pType && cells[`prop:${p.pType}`] === undefined) {
        cells[`prop:${p.pType}`] = formatValue(p.value);
      }
    });
    propertyNames.forEach(name => {
      if (cells[`prop:${name}`] === undefined) cells[`prop:${name}`] = "";
    });
    return { id: node.id, cells };
  });

  return { columns, rows };
}

const COMPARATOR = /^\s*(>=|<=|>|<|=)\s*(-?\d+(?:\.\d+)?)\s*$/;

// Whether a cell's text passes one column filter: a case-insensitive substring, or a
// numeric comparison (">3", "<= 50", "=181") when the filter looks like one.
export function matchesFilter(cell, filter) {
  const query = (filter || "").trim();
  if (query === "") return true;
  const text = cell == null ? "" : String(cell);

  const comparison = query.match(COMPARATOR);
  if (comparison) {
    const value = Number(text);
    if (text.trim() === "" || isNaN(value)) return false;
    const limit = Number(comparison[2]);
    switch (comparison[1]) {
      case ">": return value > limit;
      case "<": return value < limit;
      case ">=": return value >= limit;
      case "<=": return value <= limit;
      default: return value === limit;
    }
  }
  return text.toLowerCase().includes(query.toLowerCase());
}

// Rows passing every non-empty filter. filters: {columnKey: text}
export function filterRows(rows, filters) {
  const active = Object.entries(filters || {}).filter(([, text]) => text && text.trim() !== "");
  if (active.length === 0) return rows;
  return rows.filter(row => active.every(([key, text]) => matchesFilter(row.cells[key], text)));
}
