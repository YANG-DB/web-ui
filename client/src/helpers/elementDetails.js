// Formats a graph element's properties for the details panel.

// One display string per value: arrays are joined, objects shown as JSON, empty values as
// an em dash.
export function formatValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.length ? value.map(formatValue).join(", ") : "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

// [{pType, value}] -> [{name, value}], in the order Fuse returned them, one row per
// property name (a repeated name keeps its first value).
export function propertyRows(properties) {
  const seen = new Set();
  return (properties || [])
    .filter(p => p && p.pType && !seen.has(p.pType) && seen.add(p.pType))
    .map(p => ({ name: p.pType, value: formatValue(p.value) }));
}
