function makeEntities(entities, i, existing) {
  if (existing) {
    entities.forEach(entity => {
      const isExistingIndex = existing.findIndex(e => e.eID === entity.eID);
      if (isExistingIndex > -1) {
        existing[isExistingIndex].assignments.push(i);
      }
    });
  }
  return existing
    ? existing.concat(
        entities
          .filter(e => !existing.some(ex => ex.eID === e.eID))
          .map(e => {
            e.assignments = [i];
            return e;
          })
      )
    : entities.map(e => {
        e.assignments = [i];
        return e;
      });
}

function makeRelationships(relationships, i, existing) {
  if (existing) {
    relationships.forEach(entity => {
      const isExistingIndex = existing.findIndex(e => e.rID === entity.rID);
      if (isExistingIndex > -1) {
        existing[isExistingIndex].assignments.push(i);
      }
    });
  }
  return existing
    ? existing.concat(
        relationships
          .filter(e => !existing.some(ex => ex.rID === e.rID))
          .map(e => {
            e.assignments = [i];
            return e;
          })
      )
    : relationships.map(e => {
        e.assignments = [i];
        return e;
      });
}

// Starts from empty lists, so a result with no assignments (a query with no matches)
// renders as an empty graph instead of crashing the views.
export default function extract(results) {
  const assignments = (results && results.data && results.data.assignments) || [];
  return assignments.reduce((acc, curr, i) => {
    acc.entities = makeEntities(curr.entities || [], i, acc.entities);
    acc.relationships = makeRelationships(
      curr.relationships || [],
      i,
      acc.relationships
    );
    return acc;
  }, { entities: [], relationships: [] });
}
