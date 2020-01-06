import { useEffect, useRef, useState } from "react";
import { arraysEqual } from "../helpers";
import { Editor, Node } from "slate";
import * as slateConstants from "../constants/slate";

export default function(editor) {
  const lastFocussed = useRef(null);
  const [focussed, setFocussed] = useState(null);

  useEffect(() => {
    // here we ensure that the currently focussed node has the 'focussed' property set on it
    if (!arraysEqual(lastFocussed.current, focussed)) {
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
      if (focussed) {
        Editor.setNodes(editor, { focussed: true }, { at: focussed });
      }
    }
    lastFocussed.current = focussed;
  }, [focussed, editor]);
  return [focussed, setFocussed];
}
