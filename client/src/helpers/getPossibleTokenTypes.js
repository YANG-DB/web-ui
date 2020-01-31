import * as slateConstants from "../constants/slate";

// Given the previous token type, what token types meaningfully follow it?

export default function getPossibleTypes(previousType) {
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
