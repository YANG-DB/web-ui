import React, { useState, useCallback, useEffect } from "react";
import cn from "classnames";
import { GraphQLEditor } from "graphql-editor";
import { Modal } from "../components";
import apiService from "../services/api";
import convertOntologyToGraphQL from "../helpers/ontologyToGraphQL";
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
      className={cn(modalStyles.content, status === "LOADING" && styles.loading)}
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
  const [currentSchema, setCurrentSchema] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ontologies, setOntologies] = useState([]);
  const [selectedOntology, setSelectedOntology] = useState('dragons');

  // Load available ontologies on mount
  useEffect(() => {
    apiService.getOntologies().then(data => {
      setOntologies(data.ontologies);
    }).catch(error => {
      console.error("Failed to load ontologies list:", error);
      // Set fallback ontologies
      setOntologies([
        { id: 'dragons', name: 'Dragons' },
        { id: 'linkedin', name: 'LinkedIn' },
        { id: 'flights', name: 'Flights' }
      ]);
      alert("⚠️ Server Error: Cannot connect to backend server.\n\nPlease ensure the server is running:\n  cd /Users/liorperry/projects/web-ui\n  node server.js\n\nError: " + error.message);
    });
  }, []);

  // Load ontology when selection changes
  useEffect(() => {
    if (!selectedOntology) return;

    setIsLoading(true);
    // Load ontology from API and convert to GraphQL schema
    apiService.getOntology(selectedOntology).then(ontologyData => {
      console.log("=== RAW ONTOLOGY RESPONSE ===");
      console.log(JSON.stringify(ontologyData, null, 2));
      console.log("=== END RAW ONTOLOGY ===");

      // apiService.getOntology already extracts data[0], so wrap it back
      const wrappedData = { data: [ontologyData] };
      const graphqlSchema = convertOntologyToGraphQL(wrappedData);
      console.log("=== CONVERTED GRAPHQL SCHEMA ===");
      console.log("Schema length:", graphqlSchema.length, "characters");
      console.log("Schema preview (first 500 chars):");
      console.log(graphqlSchema.substring(0, 500));
      console.log("\n--- FULL SCHEMA ---\n");
      console.log(graphqlSchema);
      console.log("\n=== END GRAPHQL SCHEMA ===");

      // Set the schema - GraphQLEditor requires both 'code' and 'libraries'
      // 'libraries' is for shared/reusable schema, 'code' is the main schema
      setCurrentSchema({ code: graphqlSchema, libraries: '' });
      setIsLoading(false);
    }).catch(error => {
      console.error("Failed to load ontology:", error);
      setCurrentSchema({
        code: `# ⚠️ Error Loading Ontology\n\n# Cannot connect to backend server.\n# Please ensure the server is running:\n#   cd /Users/liorperry/projects/web-ui\n#   node server.js\n\n# Error: ${error.message}`,
        libraries: ''
      });
      setIsLoading(false);
    });
  }, [selectedOntology]);

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
  }, [currentSchema]);

  const handleSetSchema = useCallback((schema) => {
    console.log("=== SCHEMA SET BY EDITOR ===");
    console.log(schema);
    console.log("=== END SCHEMA SET ===");
    setCurrentSchema(schema);
  }, []);

  console.log("=== CURRENT SCHEMA STATE ===", currentSchema);
  return (
    <div className={globalStyles.page}>
      <Modal
        type={dialogKey}
        closeModal={closeModal}
        renderContent={renderModalContent}
      />
      <div className={styles.menu}>
        <div className={styles.ontologySelector}>
          <label htmlFor="ontology-select">Ontology: </label>
          <select
            id="ontology-select"
            value={selectedOntology}
            onChange={(e) => setSelectedOntology(e.target.value)}
          >
            {ontologies.map(ont => (
              <option key={ont.id} value={ont.id}>
                {ont.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.actions}>
          {Object.keys(actions).map(action => (
            <button
              className={cn(styles.action, styles[action])}
              onClick={() => openModal(action)}
              key={action}
            >
              {action}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height: 'calc(100vh - 110px)', width: '100%' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>
            Loading ontology...
          </div>
        ) : (
          <GraphQLEditor schema={currentSchema} setSchema={handleSetSchema} />
        )}
      </div>
    </div>
  );
}
