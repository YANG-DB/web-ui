import { Node } from "slate";
import { getPreviousNode } from "../helpers";
import { GROUP_DEPTH } from "../helpers/elements";
import * as slateConstants from "../constants/slate";

function isNewBranchPossible(editor) {
  const path = editor.selection.anchor.path;
  const branchPath = path.slice(0, path.length - 2);
  const branchText = Node.text(Node.get(editor, branchPath));
  return path.length >= GROUP_DEPTH && !!branchText;
}

function isFilterPossible(editor) {
  const previousNode = getPreviousNode(
    editor,
    editor.selection && editor.selection.anchor.path,
    false,
    1,
    [
      slateConstants.QUANTIFIER_LABEL,
      slateConstants.QUANTIFIER_ENTRIES,
      slateConstants.QUANTIFIER_ENTRY
    ]
  );
  return (
    previousNode &&
    [
      slateConstants.ENTITY,
      slateConstants.RELATIONSHIP_IN,
      slateConstants.RELATIONSHIP_OUT
    ].includes(previousNode.variant)
  );
}

export default function(editor) {
  const result = [];
  if (isNewBranchPossible(editor)) {
    result.push(slateConstants.NEW_BRANCH);
  }
  if (isFilterPossible(editor)) {
    result.push(slateConstants.FILTER_ICON);
  }
  return result;
}
