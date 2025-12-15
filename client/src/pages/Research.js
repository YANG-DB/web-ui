import React, { useState, useCallback, useEffect, useRef } from "react";
import { Resizable } from "re-resizable";
import { connect } from "react-redux";
import { submitQuery, storeResults, cacheQuery } from "../reducers/research";
import { TextArea, Results, Aggregates } from "../components";
import apiService from "../services/api";
import styles from "../App.module.css";
import { slateToQuery } from "../helpers";

function Research({
  submitQuery,
  storeResults,
  results,
  lastQuery,
  cacheQuery
}) {
  const resizeRef = useRef(null);
  const onSubmit = useCallback(query => {
    submitQuery(query);
    apiService.getResult(slateToQuery(query)).then(results => {
      storeResults(results);
    });
  }, []);
  return (
    <div className={styles.row}>
      <div className={styles.column}>
        <TextArea
          onSubmit={onSubmit}
          lastQuery={lastQuery}
          submitQuery={submitQuery}
          cacheQuery={cacheQuery}
        />
        <Results results={results} />
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
