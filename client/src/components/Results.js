import React, { useState, useRef } from "react";
import { Resizable } from "re-resizable";
import cn from "classnames";
import { HistoryItem, Force, List, ForceMenu } from "../components";
import { extractResults } from "../helpers";
import styles from "./Results.module.css";
import globalStyles from "../App.module.css";

let timelineHeight = 300;
const types = {
  TABLE: "table",
  LIST: "list",
  GRAPH: "graph"
};

function isMaximisable(type) {
  return type === types.GRAPH;
}

function showResults(type, results, isMaximised) {
  switch (type) {
    case types.TABLE:
      return <div></div>;
    case types.LIST:
      return (
        <List
          results={results.data.assignments}
          pattern={results.data.pattern}
        />
      );
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
        <Resizable
          minWidth={100}
          enable={{
            top: false,
            right: true,
            bottom: false,
            left: false,
            topRight: false,
            bottomRight: false,
            bottomLeft: false,
            topLeft: false
          }}
        >
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
        </Resizable>
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
          <Resizable
            ref={resizeRef}
            minHeight={100}
            enable={{
              top: true,
              right: false,
              bottom: false,
              left: false,
              topRight: false,
              bottomRight: false,
              bottomLeft: false,
              topLeft: false
            }}
          >
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
          </Resizable>
        </div>
      </div>
    </div>
  );
}
