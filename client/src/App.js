import React, { useState, useCallback } from "react";
import { TextArea, Results, Header, Aggregates } from "./components";
import apiService from "./services/api";
import styles from "./App.module.css";

export default function App() {
  const [results, setResults] = useState(null);
  const onSubmit = useCallback(query => {
    apiService.getResult(query).then(results => {
      setResults(results);
    });
  }, []);
  return (
    <div className={styles.app}>
      <Header />
      <div className={styles.row}>
        <div className={styles.column}>
          <TextArea onSubmit={onSubmit} />
          <Results results={results} />
        </div>
        <Aggregates />
      </div>
    </div>
  );
}
