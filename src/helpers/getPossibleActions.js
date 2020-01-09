import { Node } from "slate";
import { getPreviousNode, isInBranch } from "../helpers";
import * as slateConstants from "../constants/slate";

export function isNewBranchPossible(editor) {
  const [branch] = isInBranch(editor) || [];
  if (Node.text(Node.get(editor, editor.selection.anchor.path))) {
    // don't allow new branch when midway through typing a node
    return false;
  }
  if (!branch) {
    return false;
  }
  if (branch.variant === slateConstants.QUANTIFIER_ENTRY) {
    const previousNode = getPreviousNode(
      editor,
      editor.selection.anchor.path,
      false
    );
    return (
      previousNode.variant === slateConstants.ENTITY ||
      previousNode.variant === slateConstants.QUANTIFIER
    );
  }
  if (branch.variant === slateConstants.FILTER) {
    // either two nodes prior is a binary operator
    // or one node prior is a unary operator
    const possibleUnaryOperator = getPreviousNode(
      editor,
      editor.selection.anchor.path,
      false
    );
    const possibleBinaryOperator = getPreviousNode(
      editor,
      editor.selection.anchor.path,
      false,
      2
    );
    if (
      possibleUnaryOperator &&
      possibleUnaryOperator.variant === slateConstants.OPERATOR
    ) {
      if (["empty", "notEmpty"].includes(Node.text(possibleUnaryOperator))) {
        return true;
      }
    }
    if (
      possibleBinaryOperator &&
      possibleBinaryOperator.variant === slateConstants.OPERATOR
    ) {
      if (!["empty", "notEmpty"].includes(Node.text(possibleBinaryOperator))) {
        return true;
      }
    }
    return false;
  }
}

export function isEscapeGroupPossible(editor) {
  if (Node.text(Node.get(editor, editor.selection.anchor.path))) {
    // don't allow new branch when midway through typing a node
    return false;
  }
  const [branch, branchPath] = isInBranch(editor) || [];
  if (branch) {
    return (
      isNewBranchPossible(editor) ||
      (!getPreviousNode(editor, editor.selection.anchor.path, false) &&
        branchPath[branchPath.length - 1] !== 0)
    );
  } else {
    return false;
  }
}

export function isFilterPossible(editor) {
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
  if (isEscapeGroupPossible(editor)) {
    result.push(slateConstants.ESCAPE_GROUP);
  }
  if (isNewBranchPossible(editor)) {
    result.push(slateConstants.NEW_BRANCH);
  }
  if (isFilterPossible(editor)) {
    result.push(slateConstants.FILTER_ICON);
  }
  return result;
}
