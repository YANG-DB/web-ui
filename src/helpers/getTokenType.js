import * as slateConstants from "../constants/slate";

export default function getTokenType(previousToken, text) {
  // infer token type based on text entered by user, and query context
  if (
    !previousToken ||
    [
      slateConstants.RELATIONSHIP,
      slateConstants.RELATIONSHIP_IN,
      slateConstants.RELATIONSHIP_OUT
    ].includes(previousToken)
  ) {
    return slateConstants.ENTITY;
  }
  if (
    previousToken === slateConstants.ENTITY ||
    previousToken === slateConstants.QUANTIFIER_LABEL
  ) {
    // could be a relationship or quantifier
    if (text === slateConstants.AND || text === slateConstants.OR) {
      return slateConstants.QUANTIFIER;
    }
    if (text[text.length - 1] === ">") {
      return slateConstants.RELATIONSHIP_OUT;
    }
    if (text[text.length - 1] === "<") {
      return slateConstants.RELATIONSHIP_IN;
    }
    return slateConstants.RELATIONSHIP;
  }
}
