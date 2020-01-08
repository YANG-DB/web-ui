import { Node } from "slate";
import * as slateConstants from "../constants/slate";
import { BRANCH_DEPTH } from "../helpers/elements";

export default function isInBranch(editor) {
  const path = editor.selection.anchor.path;

  const branchPath =
    path.length >= BRANCH_DEPTH
      ? path.slice(0, path.length - BRANCH_DEPTH + 1)
      : [];

  if (!branchPath.length) {
    return false;
  }

  const node = Node.get(editor, branchPath);

  return node.type === slateConstants.BRANCH ? node : null;
}
