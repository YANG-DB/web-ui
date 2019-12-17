/**
 * Convert query format into the nested format expected by SlateJS
 *
 */
import * as queryConstants from "../constants/query";
import * as slateConstants from "../constants/slate";

const getTokenTypeGenerator = (entities, relationships) => type => {
  if (entities.indexOf(type) > -1) {
    return slateConstants.ENTITY;
  } else if (relationships.indexOf(type) > -1) {
    return slateConstants.RELATIONSHIP;
  } else {
    return slateConstants.UNKNOWN;
  }
};

const createNode = (type, text) => {
  return {
    type,
    children: [
      {
        text
      }
    ]
  };
};

const createBranch = (relationship, entity, getTokenType) => {
  return {
    type: slateConstants.BRANCH,
    children: [
      createNode(getTokenType(relationship.type), relationship.type),
      createNode(getTokenType(entity.type), entity.type)
    ]
  };
};

const createQuantifier = (id, type, branches) => {
  return {
    id,
    type: slateConstants.GROUP,
    variant: slateConstants.QUANTIFIER,
    children: [
      createNode(slateConstants.GROUP, type),
      {
        type: slateConstants.GROUP,
        children: branches
      }
    ]
  };
};

export default function(elements, ontology) {
  const entities = ontology.entityTypes.map(el => el.eType);
  const relationships = ontology.relationshipTypes.map(el => el.rType);

  const getTokenType = getTokenTypeGenerator(entities, relationships);
  const roots = elements.reduceRight((acc, curr) => {
    if (curr.type === queryConstants.QUANT) {
      const children = [];
      curr.next.forEach(branchIndex => {
        // assume id equals array index?
        const relationship = elements[branchIndex];
        const entity = elements[branchIndex + 1];
        const possibleQuantifier = elements[branchIndex + 2];

        if (!(entity && relationship)) {
          throw new Error(
            `Cannot parse query. Invalid branch at index: ${branchIndex}`
          );
        }

        children.push(createBranch(relationship, entity, getTokenType));

        elements[branchIndex] = null;
        elements[branchIndex + 1] = null;

        if (
          possibleQuantifier &&
          possibleQuantifier.type === queryConstants.QUANT
        ) {
          // this quantifier will have been processed and will be in the acc array
          const processedIndex = acc.findIndex(
            el => el.id === possibleQuantifier.id
          );
          children.push(acc.splice(processedIndex, 1)[0]);
          elements[branchIndex + 2] = null;
        }
      });
      acc.push(createQuantifier(curr.id, curr.Type, children));
    }
    return acc;
  }, []);
  // final step: merge with leftover nodes
  return [
    {
      children: elements
        .filter(el => !!el && el.type !== queryConstants.START)
        .map(el => {
          if (el.type === queryConstants.QUANT) {
            return roots.find(r => r.id === el.id);
          } else {
            return createNode(getTokenType(el.type), el.type);
          }
        })
    }
  ];
}
