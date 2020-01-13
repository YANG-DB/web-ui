import { Node } from "slate";
import * as slateConstants from "../constants/slate";
import * as queryConstants from "../constants/query";
import getPreviousNode from "./getPreviousNode";
import getPossibleTokenTypes from "./getPossibleTokenTypes";
import getPossibleActions from "./getPossibleActions";

export default function getPossibleSchemaValues(editor, ontology, structure) {
  // return the possible tokens given the state of the editor and the available schema
  const previousNode = getPreviousNode(editor, editor.selection.anchor.path);
  // first get possible token types based on previous type, then expand it to the schema
  return getPossibleTokenTypes(previousNode.variant)
    .reduce((acc, curr) => {
      switch (curr) {
        case slateConstants.RELATIONSHIP: {
          // take into account prior entity
          const entity = previousNode;
          return acc.concat(
            ontology.relationshipTypes
              .filter(
                r =>
                  !r.directional &&
                  r.ePairs.some(({ eTypeA }) => eTypeA === Node.text(entity))
              )
              .map(r => r.rType)
          );
        }
        case slateConstants.RELATIONSHIP_IN: {
          // take into account prior entity
          const entity = previousNode;
          return acc.concat(
            ontology.relationshipTypes
              .filter(
                r =>
                  r.directional &&
                  r.ePairs.some(({ eTypeB }) => eTypeB === Node.text(entity))
              )
              .map(r => `${r.rType}<`)
          );
        }
        case slateConstants.RELATIONSHIP_OUT: {
          // take into account prior entity
          const entity = previousNode;
          return acc.concat(
            ontology.relationshipTypes
              .filter(
                r =>
                  r.directional &&
                  r.ePairs.some(({ eTypeA }) => eTypeA === Node.text(entity))
              )
              .map(r => `${r.rType}>`)
          );
        }
        case slateConstants.ENTITY: {
          // take into account prior relationship, if any
          const previousRelationship = previousNode;
          if (!previousRelationship) {
            return acc.concat(ontology.entityTypes.map(e => e.eType));
          }
          const previousEntity = getPreviousNode(
            editor,
            editor.selection.anchor.path,
            true,
            2
          );
          if (previousRelationship.variant === slateConstants.RELATIONSHIP) {
            return ontology.relationshipTypes
              .filter(
                r =>
                  !r.directional &&
                  r.ePairs.some(
                    ({ eTypeA, eTypeB }) =>
                      eTypeA === Node.text(previousEntity) ||
                      eTypeB === Node.text(previousEntity)
                  )
              )
              .reduce((acc, curr) => {
                curr.ePairs.forEach(({ eTypeA, eTypeB }) => {
                  if (!acc.includes(eTypeA)) {
                    acc.push(eTypeA);
                  }
                  if (!acc.includes(eTypeB)) {
                    acc.push(eTypeB);
                  }
                });
                return acc;
              }, []);
          } else if (
            previousRelationship.variant === slateConstants.RELATIONSHIP_IN
          ) {
            // relationships for which the previous entity is 'A'
            return ontology.relationshipTypes
              .filter(
                r =>
                  r.directional && r.rType === Node.text(previousRelationship)
              )
              .reduce((acc, curr) => {
                curr.ePairs.forEach(({ eTypeA, eTypeB }) => {
                  if (
                    eTypeB === Node.text(previousEntity) &&
                    !acc.includes(eTypeA)
                  ) {
                    acc.push(eTypeA);
                  }
                });
                return acc;
              }, []);
          } else if (
            previousRelationship.variant === slateConstants.RELATIONSHIP_OUT
          ) {
            // relationships for which the previous entity is 'B'
            return ontology.relationshipTypes
              .filter(
                r =>
                  r.directional && r.rType === Node.text(previousRelationship)
              )
              .reduce((acc, curr) => {
                curr.ePairs.forEach(({ eTypeA, eTypeB }) => {
                  if (
                    eTypeA === Node.text(previousEntity) &&
                    !acc.includes(eTypeB)
                  ) {
                    acc.push(eTypeB);
                  }
                });
                return acc;
              }, []);
          }
          return acc;
        }
        case slateConstants.VARIABLE: {
          // take into account prior node to see what properties it has
          const previousNode = getPreviousNode(
            editor,
            editor.selection.anchor.path,
            true,
            2
          );
          if (previousNode.variant === slateConstants.ENTITY) {
            return acc.concat(
              (
                ontology.entityTypes.find(
                  e => e.eType === Node.text(previousNode)
                ) || {}
              ).properties || []
            );
          } else if (previousNode.variant === slateConstants.RELATIONSHIP) {
            return (
              acc.concat(
                ontology.relationshipTypes
                  .filter(r => !r.directional)
                  .find(r => r.rType === Node.text(previousNode)) || {}
              ).properties || []
            );
          } else if (
            previousNode.variant === slateConstants.RELATIONSHIP_IN ||
            previousNode.variant === slateConstants.RELATIONSHIP_OUT
          ) {
            return acc.concat(
              (
                ontology.relationshipTypes
                  .filter(r => r.directional)
                  .find(r => r.rType === Node.text(previousNode)) || {}
              ).properties || []
            );
          }
          return acc;
        }
        case slateConstants.OPERATOR: {
          // consider previous property, grab appropriate operators from structure file
          const previousNode = getPreviousNode(
            editor,
            editor.selection.anchor.path,
            false
          );
          const variableType = (
            ontology.properties.find(p => p.name === Node.text(previousNode)) ||
            {}
          ).type;
          const possibleOperators = Object.keys(structure.operators).filter(
            op => structure.operators[op].includes(variableType)
          );
          return acc.concat(possibleOperators);
        }
        case slateConstants.VALUE: {
          // consider previous property; may need to show a datepicker
          const fieldNode = getPreviousNode(
            editor,
            editor.selection.anchor.path,
            false,
            2
          );
          const operatorNode = getPreviousNode(
            editor,
            editor.selection.anchor.path,
            false
          );
          const variableType = (
            ontology.properties.find(p => p.name === Node.text(fieldNode)) || {}
          ).type;
          if (
            variableType === queryConstants.DATE &&
            !queryConstants.UNARY_OPERATORS.includes(Node.text(operatorNode))
          ) {
            if (
              queryConstants.RANGE_OPERATORS.includes(Node.text(operatorNode))
            ) {
              return acc.concat([queryConstants.DATE_RANGE]);
            } else {
              return acc.concat([queryConstants.DATE]);
            }
          }
          return acc;
        }
        case slateConstants.QUANTIFIER: {
          // take into account prior entity
          return acc.concat([slateConstants.AND, slateConstants.OR]);
        }
        default:
          return acc;
      }
    }, [])
    .concat(getPossibleActions(editor));
}
