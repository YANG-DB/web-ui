import React from "react";
import cn from "classnames";
import { Editor } from "graphql-editor";
import styles from "./Schema.module.css";
import globalStyles from "../App.module.css";

const actions = {
  UPDATE: "update",
  SAVE: "save",
  EXPORT: "export",
  IMPORT: "import",
  SHARE: "share"
};

export default function Schema() {
  return (
    <div className={globalStyles.page}>
      <div className={styles.menu}>
        <div className={styles.actions}>
          {Object.keys(actions).map(action => (
            <button className={cn(styles.action, styles[actions[action]])}>
              {actions[action]}
            </button>
          ))}
        </div>
      </div>
      <Editor editorVisible={true} />
    </div>
  );
}
