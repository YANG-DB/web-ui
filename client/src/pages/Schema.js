import React, { useState, useCallback, useEffect } from "react";
import cn from "classnames";
import { GraphQLEditor } from "graphql-editor";
import { Modal } from "../components";
import apiService from "../services/api";
import fuse, { fuseBaseUrl } from "../services/fuse";
import { resolveOntologyId } from "../helpers/normalizeFuseResult";
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
  // Where the ontologies come from: "fuse" when Fuse answers, otherwise the mock server.
  const [source, setSource] = useState(null);
  const [fuseIds, setFuseIds] = useState([]);
  const [loadError, setLoadError] = useState(null);

  // Load the ontology list: from Fuse when it is up, otherwise from the mock server.
  useEffect(() => {
    let cancelled = false;
    const fallback = [
      { id: 'dragons', name: 'Dragons' },
      { id: 'linkedin', name: 'LinkedIn' },
      { id: 'flights', name: 'Flights' }
    ];
    const pick = list => {
      setOntologies(list);
      setSelectedOntology(current =>
        list.some(o => o.id === current) ? current : (list.find(o => o.id === 'dragons') || list[0] || { id: current }).id
      );
    };
    fuse.health().then(up => {
      if (cancelled) return null;
      if (up) {
        return fuse.listOntologies().then(list => {
          if (cancelled) return;
          // fuseIds before source: these updates are not batched here, and the ontology effect
          // must not run with a source of "fuse" and no ids to resolve against.
          setFuseIds(list.map(o => o.ont));
          setSource('fuse');
          pick(list.map(o => ({ id: o.ont.toLowerCase(), name: o.ont })));
        });
      }
      return apiService.getOntologies().then(data => {
        if (cancelled) return;
        setSource('mock');
        pick(data.ontologies);
      });
    }).catch(error => {
      if (cancelled) return;
      setSource('mock');
      pick(fallback);
      setLoadError(`Neither Fuse nor the mock server answered: ${error.message}`);
    });
    return () => { cancelled = true; };
  }, []);

  // Load the selected ontology and show it as a GraphQL schema.
  useEffect(() => {
    if (!selectedOntology || !source) return;

    let stale = false;
    setIsLoading(true);
    const load = source === 'fuse'
      ? fuse.getOntology(resolveOntologyId(fuseIds, selectedOntology) || selectedOntology)
      : apiService.getOntology(selectedOntology);
    load.then(ontologyData => {
      if (stale) return;
      // Both return the ontology object itself; the converter expects {data: [ontology]}
      const graphqlSchema = convertOntologyToGraphQL({ data: [ontologyData] });
      // GraphQLEditor requires both 'code' and 'libraries' ('libraries' is for shared schema)
      setCurrentSchema({ code: graphqlSchema, libraries: '' });
      setLoadError(null);
      setIsLoading(false);
    }).catch(error => {
      if (stale) return;
      setCurrentSchema({
        code: `# Could not load the ${selectedOntology} ontology from the ${source === 'fuse' ? 'Fuse server' : 'mock server'}.\n# ${error.message}\n#\n# For Fuse, see the Backends section of the README; for the mock server, run "yarn server".`,
        libraries: ''
      });
      setIsLoading(false);
    });
    return () => { stale = true; };
  }, [selectedOntology, source, fuseIds]);

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
        <span className={styles.source} data-source={source || 'unknown'} title={source === 'fuse' ? fuseBaseUrl() : undefined}>
          {source === 'fuse' ? 'From Fuse' : source === 'mock' ? 'From the mock server' : 'Connecting…'}
        </span>
        {loadError && <span className={styles.sourceError} role="alert">{loadError}</span>}
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
