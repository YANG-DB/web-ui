import * as slateConstants from "../constants/slate";

export default function getTokenType(previousToken, text) {
  // infer token type based on text entered by user, and query context
  if (!previousToken || previousToken === slateConstants.RELATIONSHIP) {
    return slateConstants.ENTITY;
  }
  if (previousToken === slateConstants.ENTITY) {
    // could be a relationship or quantifier
    if (text === slateConstants.AND || text === slateConstants.OR) {
      return slateConstants.QUANTIFIER;
    }
    return slateConstants.RELATIONSHIP;
  }
  if (previousToken === slateConstants.QUANTIFIER_LABEL) {
    // could be relationship or quantifier
    if (text === slateConstants.AND || text === slateConstants.OR) {
      return slateConstants.QUANTIFIER;
    }
    return slateConstants.RELATIONSHIP;
  }
}
