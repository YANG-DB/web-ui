import { getPreviousNode, isInBranch } from "../helpers";
import * as slateConstants from "../constants/slate";

function isNewBranchPossible(editor) {
  const branch = isInBranch(editor);
  if (!branch) {
    return false;
  }
  if (branch.variant === slateConstants.QUANTIFIER_ENTRY) {
    // affirm that previous is an entity
    const previousNode = getPreviousNode(
      editor,
      editor.selection.anchor.path,
      false
    );
    return previousNode.variant === slateConstants.ENTITY;
  }
  if (branch.variant === slateConstants.FILTER) {
    // TODO: extend 'isTerminalNode' to see if the filter is complete
    return false;
  }
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
