import React, { useState, useCallback, useEffect } from "react";
import { connect } from "react-redux";
import { submitQuery, storeResults } from "../reducers/research";
import { TextArea, Results, Aggregates } from "../components";
import apiService from "../services/api";
import styles from "../App.module.css";
import { slateToQuery } from "../helpers";

function Research({ submitQuery, storeResults, results, query }) {
  const onSubmit = useCallback(query => {
    submitQuery(query);
    apiService.getResult(slateToQuery(query)).then(results => {
      storeResults(results);
    });
  }, []);
  return (
    <div className={styles.row}>
      <div className={styles.column}>
        <TextArea onSubmit={onSubmit} lastQuery={query} />
        <Results results={results} />
      </div>
      <Aggregates />
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
  { submitQuery, storeResults }
)(Research);
