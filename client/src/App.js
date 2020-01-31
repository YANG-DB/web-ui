import React, { useState, useCallback } from "react";
import { TextArea, Results, Header } from "./components";
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
      <div className={styles.content}>
        <Results results={results} />
        <TextArea onSubmit={onSubmit} />
      </div>
    </div>
  );
}
