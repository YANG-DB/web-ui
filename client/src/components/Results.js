import React, { useState, useRef } from "react";
import { Resizable } from "re-resizable";
import cn from "classnames";
import { HistoryItem, Force, List, ForceMenu, Card, Table, EntityList, JsonView } from "../components";
import { extractResults } from "../helpers";
import styles from "./Results.module.css";
import globalStyles from "../App.module.css";

let timelineHeight = 300;
const types = {
  TABLE: "table",
  LIST: "list",
  GRAPH: "graph",
  JSON: "json"
};

function isMaximisable(type) {
  return type === types.GRAPH;
}

function showResults(type, results, isMaximised) {
  switch (type) {
    case types.TABLE:
      return <Table results={results} />;
    case types.LIST:
      return <EntityList results={results} />;
    case types.JSON:
      return <JsonView results={results} />;
    case types.GRAPH: {
      return isMaximised ? (
        <ForceMenu results={results} />
      ) : (
        <Force results={results} hoveredIndex={null} />
      );
    }
    default:
      return <div></div>;
  }
}

export default function Results({ results }) {
  const [resultType, setResultType] = useState(types.GRAPH);
  const [maximised, setMaximised] = useState(false);
  const resizeRef = useRef(null);
  return (
    <div className={cn(styles.results, globalStyles.section)}>
      <div className={cn(styles.wrapper, globalStyles.rounded)}>
        {/* History and Bla Bla panels removed */}
        <div className={styles.chartWrapper}>
          <div
            className={cn(
              globalStyles.card,
              styles.tabs,
              globalStyles.right,
              globalStyles.top
            )}
          >
            <div className={styles.headers}>
              <h2 className={styles.selectedOption}>{resultType}</h2>
              <div className={styles.options}>
                {Object.keys(types).map(t => {
                  return (
                    <button
                      key={t}
                      className={cn(
                        styles[types[t]],
                        resultType === types[t] && styles.selected
                      )}
                      onClick={() => setResultType(types[t])}
                    ></button>
                  );
                })}
              </div>
            </div>
            <div
              className={cn(
                styles.resultWrapper,
                maximised && styles.maximised
              )}
            >
              {isMaximisable(resultType) && !maximised && (
                <button
                  onClick={() => setMaximised(true)}
                  className={styles.maximise}
                ></button>
              )}
              {maximised && (
                <button
                  onClick={() => setMaximised(false)}
                  className={styles.minimise}
                ></button>
              )}
              {results ? (
                showResults(resultType, results, maximised)
              ) : (
                <div></div>
              )}
            </div>
          </div>
          {/* Timeline panel removed */}
        </div>
      </div>
    </div>
  );
}
