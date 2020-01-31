import getPossibleTokenTypes from "./getPossibleTokenTypes";
import * as slateConstants from "../constants/slate";

// Deterministically infer intended token type based on what is possible, and what has been typed

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
  const possibleTypes = getPossibleTokenTypes(previousToken);
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
