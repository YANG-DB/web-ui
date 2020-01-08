import { Node } from "slate";
import * as slateConstants from "../constants/slate";
import { getBranchPath } from "../helpers";

export default function isInBranch(editor) {
  const branchPath = getBranchPath(editor);

  if (!branchPath.length) {
    return false;
  }

  const node = Node.get(editor, branchPath);

  return node.type === slateConstants.BRANCH ? [node, branchPath] : null;
}
