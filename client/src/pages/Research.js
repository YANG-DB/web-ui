import React, { useCallback, useState, useEffect } from "react";
import { Resizable } from "re-resizable";
import { connect } from "react-redux";
import { submitQuery, storeResults, cacheQuery } from "../reducers/research";
import { VisualQueryBuilder, Results } from "../components";
import apiService from "../services/api";
import styles from "../App.module.css";
import researchStyles from "./Research.module.css";

function Research({
  submitQuery,
  storeResults,
  results,
  lastQuery,
  cacheQuery
}) {
  const [ontologies, setOntologies] = useState([]);
  const [selectedOntology, setSelectedOntology] = useState('dragons');

  // Load available ontologies on mount
  useEffect(() => {
    apiService.getOntologies().then(data => {
      setOntologies(data.ontologies);
    }).catch(error => {
      console.error("Failed to load ontologies list:", error);
      alert("⚠️ Server Error: Cannot connect to backend server.\n\nPlease ensure the server is running:\n  cd /Users/liorperry/projects/web-ui\n  node server.js\n\nError: " + error.message);
    });
  }, []);

  const onSubmit = useCallback(query => {
    console.log("Visual query submitted:", query);
    submitQuery(query);

    // For now, we'll convert the query to a simple format
    // You may need to enhance this based on your backend requirements
    apiService.getResult(query).then(results => {
      storeResults(results);
    }).catch(error => {
      console.error("Error fetching results:", error);
    });
  }, [submitQuery, storeResults]);

  return (
    <div className={styles.row}>
      <div className={styles.column} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className={researchStyles.ontologySelector}>
          <label htmlFor="research-ontology-select">Ontology: </label>
          <select
            id="research-ontology-select"
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
        <Resizable
          defaultSize={{
            height: '40%',
            width: '100%'
          }}
          minHeight={200}
          maxHeight="80%"
          enable={{
            top: false,
            right: false,
            bottom: true,
            left: false,
            topRight: false,
            bottomRight: false,
            bottomLeft: false,
            topLeft: false
          }}
          handleStyles={{
            bottom: {
              height: '12px',
              bottom: '-6px',
              cursor: 'row-resize',
              background: 'linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.05) 40%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 60%, transparent 100%)',
              zIndex: 10
            }
          }}
          handleComponent={{
            bottom: (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  pointerEvents: 'none'
                }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '6px',
                    background: '#6a6a6a',
                    borderRadius: '3px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  className="resize-handle-bar"
                />
              </div>
            )
          }}
          style={{ marginBottom: '10px' }}
        >
          <VisualQueryBuilder onSubmit={onSubmit} ontologyType={selectedOntology} />
        </Resizable>
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <Results results={results} />
        </div>
      </div>
      {/* Aggregates/Trends panel removed */}
    </div>
  );
}

export default connect(
  state => ({
    lastQuery: state.research.lastQuery,
    results:
      state.research.history[state.research.history.length - 1] &&
      state.research.history[state.research.history.length - 1].results
  }),
  { submitQuery, storeResults, cacheQuery }
)(Research);
