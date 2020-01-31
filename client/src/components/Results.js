import React, { useState } from "react";
import cn from "classnames";
import { ListItem } from "../components";
import styles from "./Results.module.css";
import globalStyles from "../App.module.css";
import Force from "./Force";

const types = {
  TABLE: "Table",
  LIST: "List",
  GRAPH: "Graph"
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
        <div className={styles.aggregates}>
          <div
            className={cn(globalStyles.card, styles.summary, globalStyles.top)}
          >
            <h2>Summary</h2>
            <ul className={styles.summaryTable}>
              {[
                { label: "Person", value: 4053 },
                { label: "Know", value: 6454 },
                { label: "Own", value: 1233 },
                { label: "Lives", value: 2355 },
                { label: "Horse", value: 1001 },
                { label: "Kingdom", value: 40 }
              ].map((el, i) => (
                <ListItem label={el.label} value={el.value} key={i} />
              ))}
            </ul>
          </div>
          <div className={cn(globalStyles.card, styles.trends)}>
            <h2>Trends</h2>
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
          <div className={styles.headers}>
            {Object.keys(types).map(t => {
              return (
                <h3
                  className={cn(resultType === types[t] && styles.selected)}
                  key={t}
                >
                  <button
                    data-hover={types[t]}
                    onClick={() => setResultType(types[t])}
                  >
                    {types[t]}
                  </button>
                </h3>
              );
            })}
          </div>
          <div className={styles.resultWrapper}>
            {results ? showResults(resultType, extract(results)) : <div></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function extract(results) {
  return results.data.cursorResourceInfos[0].pageResourceInfos[0].data
    .assignments[0];
}
