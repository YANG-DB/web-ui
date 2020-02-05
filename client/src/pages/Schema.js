import React from "react";
import { Editor } from "graphql-editor";
import globalStyles from "../App.module.css";

export default function Schema() {
  return (
    <div className={globalStyles.page}>
      <Editor editorVisible={true} />
    </div>
  );
}
