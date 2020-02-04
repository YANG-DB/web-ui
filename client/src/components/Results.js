import React, { useState } from "react";
import cn from "classnames";
import { HistoryItem } from "../components";
import { extractResults } from "../helpers";
import styles from "./Results.module.css";
import globalStyles from "../App.module.css";
import Force from "./Force";

const types = {
  TABLE: "table",
  LIST: "list",
  GRAPH: "graph"
};

function showResults(type, results) {
  switch (type) {
    case types.TABLE:
      return <div></div>;
    case types.LIST:
      return <div></div>;
    case types.GRAPH:
      return <Force results={results}></Force>;
    default:
      return <div></div>;
  }
}

export default function Results({ results }) {
  const [resultType, setResultType] = useState(types.GRAPH);
  return (
    <div className={cn(styles.results, globalStyles.section)}>
      <div className={cn(styles.wrapper, globalStyles.rounded)}>
        <div className={styles.history}>
          <div className={cn(globalStyles.card, globalStyles.top)}>
            <h2>History</h2>
            <ul className={styles.historyTable}>
              {[
                {
                  date: "2d ago",
                  value: "Guy ask the same question as lior but..."
                },
                {
                  date: "2d ago",
                  value: "Lior asks 4 questions about dragon"
                },
                {
                  date: "2d ago",
                  value: "Dana asks new question about dragon but there is"
                },
                {
                  date: "2d ago",
                  value: "Guy ask the same question as lior but..."
                },
                {
                  date: "2d ago",
                  value: "Guy ask the same question as lior but..."
                },
                {
                  date: "2d ago",
                  value: "Guy ask the same question as lior but..."
                }
              ].map((el, i) => (
                <HistoryItem date={el.date} value={el.value} key={i} />
              ))}
            </ul>
          </div>
          <div className={cn(globalStyles.card)}>
            <h2>Bla Bla</h2>
          </div>
        </div>
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
            <div className={styles.resultWrapper}>
              {results ? (
                showResults(resultType, extractResults(results))
              ) : (
                <div></div>
              )}
            </div>
          </div>
          <div
            className={cn(
              globalStyles.card,
              styles.tabs,
              globalStyles.right,
              globalStyles.top
            )}
          >
            <h2>Timeline</h2>
          </div>
        </div>
      </div>
    </div>
  );
}
