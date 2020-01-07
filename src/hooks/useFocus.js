import { useEffect, useRef } from "react";
import { Editor, Node } from "slate";
import { ReactEditor } from "slate-react";
import * as slateConstants from "../constants/slate";

export default function(editor, onFocusChange) {
  const lastFocussed = useRef(null);
  const focusPath = editor.selection && editor.selection.focus.path;

  useEffect(() => {
    // here we ensure that the currently focussed node has the 'focussed' property set on it
    if (lastFocussed.current) {
      Node.has(editor, lastFocussed.current) &&
        Editor.setNodes(
          editor,
          { focussed: false },
          { at: lastFocussed.current }
        );
    }
    const descendants = Node.descendants(editor);
    let result = descendants.next();
    while (!result.done) {
      const [node, path] = result.value;
      if (
        [slateConstants.QUANTIFIER_ENTRY, slateConstants.FILTER].includes(
          node.variant
        )
      ) {
        // branches should have path stored on them in order to determine whether it should be expanded/collapsed
        Editor.setNodes(
          editor,
          {
            path
          },
          { at: path }
        );
      }
      result = descendants.next();
    }
    if (focusPath) {
      Editor.setNodes(editor, { focussed: true }, { at: focusPath });
      onFocusChange(
        focusPath,
        ReactEditor.toDOMNode(editor, Node.get(editor, focusPath))
      );
    } else {
      onFocusChange(focusPath, null);
    }
    lastFocussed.current = focusPath;
  }, [editor, focusPath, onFocusChange]);
  return focusPath;
}
