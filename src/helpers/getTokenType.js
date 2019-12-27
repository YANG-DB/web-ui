import * as slateConstants from "../constants/slate";

export function getPossibleTypes(previousType) {
  if (!previousType) {
    return [slateConstants.ENTITY];
  }
  switch (previousType) {
    case slateConstants.RELATIONSHIP:
    case slateConstants.RELATIONSHIP_IN:
    case slateConstants.RELATIONSHIP_OUT:
      return [slateConstants.ENTITY];
    case slateConstants.ENTITY:
      return [
        slateConstants.QUANTIFIER,
        slateConstants.RELATIONSHIP,
        slateConstants.RELATIONSHIP_IN,
        slateConstants.RELATIONSHIP_OUT
      ];
    case slateConstants.FILTER_LABEL:
      return [slateConstants.VARIABLE];
    case slateConstants.VARIABLE:
      return [slateConstants.OPERATOR];
    case slateConstants.OPERATOR:
      return [slateConstants.VALUE];
    default:
      return [];
  }
}

const predicates = {
  // constraints that need to be met for each type
  [slateConstants.ENTITY]: text => true,
  [slateConstants.RELATIONSHIP]: text =>
    text[text.length - 1] !== ">" &&
    text[text.length - 1] !== "<" &&
    text !== slateConstants.AND &&
    text !== slateConstants.OR,
  [slateConstants.RELATIONSHIP_IN]: text => text[text.length - 1] === "<",
  [slateConstants.RELATIONSHIP_OUT]: text => text[text.length - 1] === ">",
  [slateConstants.QUANTIFIER]: text =>
    text === slateConstants.AND || text === slateConstants.OR,
  [slateConstants.VALUE]: text => true,
  [slateConstants.OPERATOR]: text => true,
  [slateConstants.VALUE]: text => true
};

export default function getTokenType(previousToken, text) {
  // infer token type based on text entered by user, and query context
  const possibleTypes = getPossibleTypes(previousToken);
  if (possibleTypes.length === 0) {
    return slateConstants.UNKNOWN;
  }
  if (possibleTypes.length === 1) {
    return possibleTypes[0];
  }
  const filteredByText = possibleTypes.filter(type => predicates[type](text));
  if (filteredByText.length === 1) {
    return filteredByText[0];
  }
  return slateConstants.UNKNOWN;
}
