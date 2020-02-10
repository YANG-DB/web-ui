import React, { useState, useCallback, useEffect } from "react";
import cn from "classnames";
import { Editor } from "graphql-editor";
import { Modal } from "../components";
import apiService from "../services/api";
import styles from "./Schema.module.css";
import globalStyles from "../App.module.css";
import modalStyles from "../components/Modal.module.css";

const actions = {
  update: "update", // same as below
  save: "save", // posts schema to a url: dialog prompts name
  export: "export", // export svg image (future)
  import: "import", // presents list of schema names to choose from
  share: "share" // future
};

function Action({ onLoad, onAction, actionLabel, children }) {
  const [status, setStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  function render(children, status) {
    switch (status) {
      case "SUCCESS":
        return "Successfully completed.";
      case "ERROR":
        return (
          <div>
            Something went wrong:
            <div className={modalStyles.errorMessage}>{errorMessage}</div>
          </div>
        );
      default:
        return children;
    }
  }
  useEffect(() => {
    if (onLoad) {
      setStatus("LOADING");
      onLoad().then(
        result => {
          setStatus("LOADING_SUCCESS");
        },
        err => {
          setStatus("ERROR");
          setErrorMessage(err.message);
        }
      );
    }
  }, []);
  return (
    <div
      className={cn(status === "LOADING" && styles.loading)}
      className={modalStyles.content}
    >
      {render(children, status)}
      {(onLoad && status === "LOADING_SUCCESS") || !status ? (
        <div>
          <button
            onClick={() => {
              setStatus("LOADING");
              onAction().then(
                result => {
                  console.log("result", result);
                  setStatus("SUCCESS");
                },
                err => {
                  setStatus("ERROR");
                  setErrorMessage(err.message);
                }
              );
            }}
          >
            {actionLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Import({ onImport }) {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  return (
    <Action
      actionLabel={"Import"}
      onAction={() =>
        apiService.getSchema(selectedItem).then(schema => onImport(schema))
      }
      onLoad={() =>
        apiService.getSchemaList().then(list => {
          setItems(list.schema);
          return list.schema;
        })
      }
    >
      <select name="schema" id="schema" size={items.length}>
        {items.map(item => {
          return (
            <option value={item.id} key={item.id}>
              {item.label}
            </option>
          );
        })}
      </select>
    </Action>
  );
}

function Save({ value }) {
  const [label, setLabel] = useState("");
  return (
    <Action
      onAction={() => apiService.saveSchema(label, value)}
      actionLabel={"Save"}
    >
      <div>
        <label htmlFor="label" className={styles.schemaLabel}>
          Enter schema name:{" "}
        </label>
        <input
          type="text"
          name="label"
          id="label"
          onChange={e => setLabel(e.target.value)}
        />
      </div>
    </Action>
  );
}

export default function Schema() {
  const [dialogKey, setDialogKey] = useState(null);
  const [currentSchema, setCurrentSchema] = useState("");

  const closeModal = useCallback(() => {
    setDialogKey(null);
  }, []);
  const openModal = useCallback(key => {
    setDialogKey(key);
  }, []);
  const renderModalContent = useCallback(key => {
    switch (key) {
      case actions.update:
      case actions.save:
        return <Save value={currentSchema} />;
      case actions.import:
        return <Import onImport={value => setCurrentSchema(value)} />;
      default:
        return <div>No match</div>;
    }
  });
  console.log("current schema", currentSchema);
  return (
    <div className={globalStyles.page}>
      <Modal
        type={dialogKey}
        closeModal={closeModal}
        renderContent={renderModalContent}
      />
      <div className={styles.menu}>
        <div className={styles.actions}>
          {Object.keys(actions).map(action => (
            <button
              className={cn(styles.action, styles[action])}
              onClick={() => openModal(action)}
            >
              {action}
            </button>
          ))}
        </div>
      </div>
      <Editor editorVisible={true} />
    </div>
  );
}
