import React, { useState, useCallback, useEffect, useRef } from "react";
import { Resizable } from "re-resizable";
import { connect } from "react-redux";
import { cacheQuery, storeResults } from "../reducers/research";
import { TextArea, Results, Aggregates } from "../components";
import apiService from "../services/api";
import styles from "../App.module.css";
import { slateToQuery } from "../helpers";

function Research({ cacheQuery, storeResults, results, query }) {
  const resizeRef = useRef(null);
  const onSubmit = useCallback(query => {
    cacheQuery(query);
    apiService.getResult(slateToQuery(query)).then(results => {
      storeResults(results);
    });
  }, []);
  return (
    <div className={styles.row}>
      <div className={styles.column}>
        <TextArea
          onSubmit={onSubmit}
          lastQuery={query}
          cacheQuery={cacheQuery}
        />
        <Results results={results} />
      </div>
      <Resizable
        ref={resizeRef}
        minWidth={100}
        enable={{
          top: false,
          right: false,
          bottom: false,
          left: true,
          topRight: false,
          bottomRight: false,
          bottomLeft: false,
          topLeft: false
        }}
      >
        <Aggregates />
      </Resizable>
    </div>
  );
}

export default connect(
  state => ({
    query:
      state.research.history[state.research.history.length - 1] &&
      state.research.history[state.research.history.length - 1].query,
    results:
      state.research.history[state.research.history.length - 1] &&
      state.research.history[state.research.history.length - 1].results
  }),
  { cacheQuery, storeResults }
)(Research);
