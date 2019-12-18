/**
 * Convert query format into the nested format expected by SlateJS
 */
import * as queryConstants from "../constants/query";
import * as slateConstants from "../constants/slate";

let getTokenType;

const getTokenTypeGenerator = (entities, relationships) => element => {
  const type = element.type;
  if (entities.indexOf(type) > -1) {
    return slateConstants.ENTITY;
  } else if (relationships.indexOf(type) > -1) {
    if (element.dir === queryConstants.OUT) {
      return slateConstants.RELATIONSHIP_OUT;
    } else if (element.dir === queryConstants.IN) {
      return slateConstants.RELATIONSHIP_IN;
    } else {
      return slateConstants.RELATIONSHIP;
    }
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

const createNodeList = element => {
  // create array containing node possibly followed by filters
  const filterGroup = [];
  if (element.properties) {
    filterGroup.push(
      createFilterGroup(
        Object.keys(element.properties).map(filterKey => {
          return createFilter(
            filterKey,
            element.properties[filterKey].constraint,
            JSON.stringify(element.properties[filterKey].value) // accounting for array values
          );
        })
      )
    );
  }
  return [createNode(getTokenType(element), element.type), ...filterGroup];
};

const createBranch = (relationship, entity, quantifier) => {
  return {
    type: slateConstants.BRANCH,
    children: [
      ...createNodeList(relationship),
      ...createNodeList(entity),
      ...(quantifier ? [quantifier] : [])
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

const createFilter = (variable, operator, value) => {
  return {
    type: slateConstants.FILTER,
    children: [
      {
        text: variable,
        type: slateConstants.VARIABLE
      },
      {
        text: operator,
        type: slateConstants.OPERATOR
      },
      {
        text: value,
        type: slateConstants.VALUE
      }
    ]
  };
};

const createFilterGroup = filters => {
  return {
    type: slateConstants.GROUP,
    variant: slateConstants.FILTER_GROUP,
    children: [
      createNode(slateConstants.GROUP, "..."),
      {
        type: slateConstants.GROUP,
        children: filters
      }
    ]
  };
};

export default function(elements, ontology) {
  const entities = ontology.entityTypes.map(el => el.eType);
  const relationships = ontology.relationshipTypes.map(el => el.rType);

  getTokenType = getTokenTypeGenerator(entities, relationships);
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
        if (
          possibleQuantifier &&
          possibleQuantifier.type === queryConstants.QUANT
        ) {
          // this quantifier will have been processed and will be in the acc array
          const processedIndex = acc.findIndex(
            el => el.id === possibleQuantifier.id
          );
          const processedQuantifier = acc.splice(processedIndex, 1)[0];
          elements[branchIndex + 2] = null;
          children.push(
            createBranch(relationship, entity, processedQuantifier)
          );
        } else {
          children.push(createBranch(relationship, entity));
        }
        elements[branchIndex] = null;
        elements[branchIndex + 1] = null;
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
        .reduce((acc, curr) => {
          if (curr.type === queryConstants.QUANT) {
            acc.push(roots.find(r => r.id === curr.id));
          } else {
            return acc.concat(createNodeList(curr));
          }
          return acc;
        }, [])
    }
  ];
}
