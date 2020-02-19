import { queryToSlate } from "../helpers";

function getPrecedence(element, pattern) {
  return pattern.elements.findIndex(el => element.eTag[0] === el.eTag);
}

function findNode(tree, id) {
  // used to find insertion point of subtree
  let match = null;
  function inner(tree, id) {
    if (tree.name === id) {
      match = tree;
      return;
    }
    if (tree.children) {
      tree.children.forEach(child => findNode(child, id));
    } else {
      return;
    }
  }
  inner(tree, id);
  return match;
}

export default function(results, pattern) {
  const unvisited = [...results.entities].sort(
    (a, b) => getPrecedence(b, pattern) - getPrecedence(a, pattern)
  );
  let result = {};

  function gatherParents(entity, acc) {
    const link = results.relationships.find(
      relationship => relationship.eID2 === entity.eID
    );
    if (!link) {
      // then we are at top of tree and can return
      result = {
        name: entity.eID,
        alias: entity.eTag[0],
        link: null
      };
      if (acc) {
        result.children = [acc];
      }
      return;
    }
    let parent;
    const unvisitedParentIndex = unvisited.findIndex(
      entity => entity.eID === link.eID1
    );
    if (unvisitedParentIndex > -1) {
      // parent not yet visited
      const parent = unvisited.splice(unvisitedParentIndex, 1)[0];
      const current = {
        name: entity.eID,
        alias: entity.eTag[0],
        link: {
          label: link.rID,
          directional: link.directional,
          type: link.rType
        }
      };
      if (acc) {
        current.children = [acc];
      }
      gatherParents(parent, current);
    } else {
      // parent must be already be visited
      const parent = findNode(result, link.eID1);
      if (!parent) {
        throw Error(
          `No parent with id ${link.eID1} found in result ${JSON.stringify(
            result
          )} nor in unvisited ${JSON.stringify(
            unvisited
          )}. For results: ${JSON.stringify(results)}`
        );
      } else {
        const current = {
          name: entity.eID,
          alias: entity.eTag[0],
          link: {
            label: link.rID,
            directional: link.directional,
            type: link.rType
          }
        };
        if (acc) {
          current.children = [acc];
        }
        // insert current subtree into result
        parent.children.push(current);
      }
      return;
    }
  }

  while (unvisited.length) {
    try {
      gatherParents(unvisited.shift());
    } catch (e) {
      console.log("Error found whilst parsing results", e);
    }
  }

  return result;
}
