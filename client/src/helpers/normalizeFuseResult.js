// Turns a Fuse page (`{assignments, pattern, ...}`) into the result shape the UI
// renders (`{data: {assignments, pattern}}`, entities keyed by `eID`).
//
// Fuse 0.9.x identifies entities by `id`, which is only unique per type (Person 1,
// Dragon 1 and Kingdom 1 all exist in the Dragons sample). Entities get
// `eID = "<eType>_<id>"`, and relationship ends are qualified the same way, using the
// relationship's `eTag1`/`eTag2` to find each end's type within the assignment.
// Entities that already carry an `eID` are left as they are.

export function qualifiedId(eType, id) {
  return `${eType}_${id}`;
}

function tagsOf(entity) {
  const tags = Array.isArray(entity.eTag) ? entity.eTag.slice() : entity.eTag ? [entity.eTag] : [];
  if (entity.tag && !tags.includes(entity.tag)) tags.push(entity.tag);
  return tags;
}

function normalizeAssignment(assignment) {
  const rawEntities = assignment.entities || [];
  const tagType = {};
  const typesById = {};
  let alreadyKeyed = rawEntities.length > 0;

  const entities = rawEntities.map(entity => {
    if (entity.eID == null) alreadyKeyed = false;
    tagsOf(entity).forEach(tag => {
      tagType[tag] = entity.eType;
    });
    const raw = entity.id;
    if (raw != null) {
      typesById[raw] = typesById[raw] || [];
      if (!typesById[raw].includes(entity.eType)) typesById[raw].push(entity.eType);
    }
    if (entity.eID != null) return { ...entity };
    return { ...entity, eID: qualifiedId(entity.eType, raw) };
  });

  const resolve = (raw, tag) => {
    if (alreadyKeyed || raw == null) return raw;
    const type = tagType[tag] || (typesById[raw] && typesById[raw][0]);
    return type ? qualifiedId(type, raw) : raw;
  };

  const relationships = (assignment.relationships || []).map(rel => ({
    ...rel,
    eID1: resolve(rel.eID1, rel.eTag1),
    eID2: resolve(rel.eID2, rel.eTag2)
  }));

  return { ...assignment, entities, relationships };
}

export default function normalizeFuseResult(page) {
  const source = page || {};
  return {
    data: {
      ...source,
      pattern: source.pattern || {},
      assignments: (source.assignments || []).map(normalizeAssignment)
    }
  };
}

// Merges a further page into an already normalized result.
export function appendFuseResult(result, page) {
  const next = normalizeFuseResult(page);
  return {
    ...result,
    data: {
      ...result.data,
      assignments: result.data.assignments.concat(next.data.assignments)
    }
  };
}

// Picks the id Fuse knows for an ontology the UI names, ignoring case
// (the UI says "dragons", Fuse says "Dragons").
export function resolveOntologyId(availableIds, wanted) {
  if (!wanted) return null;
  const ids = availableIds || [];
  if (ids.includes(wanted)) return wanted;
  const lower = String(wanted).toLowerCase();
  return ids.find(id => String(id).toLowerCase() === lower) || null;
}
