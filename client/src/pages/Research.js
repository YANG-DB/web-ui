import React, { useState, useCallback } from "react";
import { TextArea, Results, Aggregates } from "../components";
import apiService from "../services/api";
import styles from "../App.module.css";

export default function Research() {
  const [results, setResults] = useState(null);
  const onSubmit = useCallback(query => {
    apiService.getResult(query).then(results => {
      setResults(results);
    });
  }, []);
  return (
    <div className={styles.row}>
      <div className={styles.column}>
        <TextArea onSubmit={onSubmit} />
        <Results results={results} />
      </div>
      <Aggregates />
    </div>
  );
}
