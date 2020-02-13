export default function extract(results) {
  return results.data.assignments.reduce((acc, curr) => {
    if (acc.entities) {
      acc.entities = acc.entities.concat(curr.entities);
    } else {
      acc.entities = curr.entities;
    }
    if (acc.relationships) {
      acc.relationships = acc.relationships.concat(curr.relationships);
    } else {
      acc.relationships = curr.relationships;
    }
    return acc;
  }, {});
}
