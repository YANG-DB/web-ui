// Pure helpers for how the result graph looks: a colour per entity type, a readable
// label per node, and the small type badge drawn inside each node.

// Bright enough to read on the graph's dark background, distinct from each other, and
// dark text (TYPE_TEXT_COLOR) stays readable on every one of them.
export const PALETTE = [
  "#4E9BFF", // blue
  "#FF6B9D", // pink
  "#FFA502", // orange
  "#2ED573", // green
  "#B57BFF", // purple
  "#00D2D3", // cyan
  "#FFD43B", // yellow
  "#FF5E57", // red
  "#7BED9F", // mint
  "#A4B0BE", // grey
  "#ECCC68", // sand
  "#C4E538"  // lime
];

// Types from the sample ontologies keep the same colour in every result.
export const KNOWN_TYPE_COLORS = {
  Person: "#FF6B9D",
  Dragon: "#2ED573",
  Horse: "#FFA502",
  Guild: "#B57BFF",
  Kingdom: "#4E9BFF",
  Profession: "#ECCC68",
  Company: "#00D2D3",
  Position: "#7BED9F",
  School: "#C4E538",
  Skill: "#FFD43B",
  Flight: "#4E9BFF",
  Airport: "#FF5E57",
  Carrier: "#FFA502"
};

export const TYPE_TEXT_COLOR = "#10131f";

// Gives every type in `types` a colour, with no two types sharing one while the palette
// lasts. Known types keep their fixed colour; the others take unused palette colours in
// order of first appearance.
export function buildTypeColors(types) {
  const unique = [...new Set((types || []).filter(Boolean))];
  const colors = {};
  const used = new Set();
  unique.forEach(type => {
    const known = KNOWN_TYPE_COLORS[type];
    if (known && !used.has(known)) {
      colors[type] = known;
      used.add(known);
    }
  });
  let next = 0;
  unique.forEach(type => {
    if (colors[type]) return;
    const free = PALETTE.find(c => !used.has(c));
    const color = free || PALETTE[next++ % PALETTE.length];
    colors[type] = color;
    used.add(color);
  });
  return colors;
}

function propertyValue(entity, pType) {
  const prop = (entity.properties || []).find(p => p.pType === pType);
  if (!prop || prop.value == null) return null;
  const value = Array.isArray(prop.value) ? prop.value.join(", ") : String(prop.value);
  return value.trim() === "" ? null : value.trim();
}

const looksLikeAnId = value => /^[\d.:_-]+$/.test(value) || /^\d{4}-\d{2}-\d{2}/.test(value);
// ALL-CAPS values are enum values (BLACK, MALE), which describe an entity rather than name it.
const looksLikeAnEnum = value => /^[A-Z0-9_]+$/.test(value);

// The text shown under a node: name, then title, then "firstName lastName", then the first
// text property that is not an id, date or enum value, then the id (eID).
export function displayName(entity, maxLength = 28) {
  if (!entity) return "";
  let name =
    propertyValue(entity, "name") ||
    propertyValue(entity, "title") ||
    [propertyValue(entity, "firstName"), propertyValue(entity, "lastName")].filter(Boolean).join(" ");

  if (!name) {
    const firstText = (entity.properties || []).find(
      p =>
        typeof p.value === "string" &&
        p.value.trim() !== "" &&
        !looksLikeAnId(p.value.trim()) &&
        !looksLikeAnEnum(p.value.trim())
    );
    name = firstText ? firstText.value.trim() : "";
  }
  if (!name) name = String(entity.eID != null ? entity.eID : entity.id != null ? entity.id : "");
  return name.length > maxLength ? `${name.slice(0, maxLength - 1)}…` : name;
}

function escapeXml(text) {
  return String(text).replace(/[<>&"']/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]));
}

// An SVG (as a data URI) with the type name centred, used as the node's background image,
// so the type reads inside the node in smaller text than the name below it.
export function typeBadge(type, textColor = TYPE_TEXT_COLOR) {
  const text = String(type || "");
  const fontSize = Math.max(9, Math.min(22, Math.floor(150 / Math.max(text.length, 1))));
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">` +
    `<text x="50" y="50" dominant-baseline="central" text-anchor="middle" ` +
    `font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="${fontSize}" fill="${textColor}">` +
    `${escapeXml(text)}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Node diameter from its share of the most connected node's degree (connectivity is shown
// by size only; colour means type).
export function nodeSize(degree, maxDegree) {
  const ratio = maxDegree > 0 ? Math.sqrt((degree || 0) / maxDegree) : 0;
  return Math.round(36 + ratio * 44); // 36-80px
}

// Counts of nodes per type, in order of first appearance.
export function countByType(entities) {
  const counts = new Map();
  (entities || []).forEach(e => counts.set(e.eType, (counts.get(e.eType) || 0) + 1));
  return [...counts.entries()].map(([type, count]) => ({ type, count }));
}
