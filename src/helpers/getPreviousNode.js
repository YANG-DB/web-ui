import { Node } from "slate";
import * as slateConstants from "../constants/slate";
import getPreviousPath from "../helpers/getPreviousPath";

export default function getPreviousNode(
  editor,
  currentPath,
  traverseBranches = true,
  skip = 1,
  exclude = [
    slateConstants.FILTER_ENTRIES,
    slateConstants.FILTER_GROUP,
    slateConstants.QUANTIFIER_LABEL,
    slateConstants.QUANTIFIER_ENTRIES,
    slateConstants.QUANTIFIER_ENTRY,
    slateConstants.FILTER
  ]
) {
  // used for inferring current token type. skips over irrelevant nodes
  const previous = getPreviousPath(currentPath, traverseBranches);
  if (previous.length && Node.has(editor, previous)) {
    const previousNode = Node.get(editor, previous);
    if (exclude.includes(previousNode.variant)) {
      return getPreviousNode(editor, previous, true, skip);
    } else if (--skip) {
      return getPreviousNode(editor, previous, true, skip);
    } else {
      return previousNode;
    }
  }
  return false;
}
