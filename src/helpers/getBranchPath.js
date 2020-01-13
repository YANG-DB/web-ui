import { BRANCH_DEPTH } from "../helpers/elements";

export default function(editor, n = 0) {
  const path = editor.selection.anchor.path;

  return path.length >= BRANCH_DEPTH
    ? [
        ...path.slice(0, path.length - BRANCH_DEPTH),
        path[path.length - BRANCH_DEPTH] + n
      ]
    : [];
}
