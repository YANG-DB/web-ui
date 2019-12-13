import React, { useState } from "react";
import { Editor, EditorState, CompositeDecorator } from "draft-js";

import "draft-js/dist/Draft.css";
import styles from "./App.module.css";

function App() {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  return (
    <div className={styles.app}>
      <div className={styles.query}>
        <Editor editorState={editorState} onChange={setEditorState} />
        <button type="submit">Go</button>
      </div>
    </div>
  );
}

export default App;
