import React from "react";
import { TextArea, Results, Header } from "./components";
import styles from "./App.module.css";

export default function App() {
  return (
    <div className={styles.app}>
      <Header />
      <div className={styles.content}>
        <Results />
        <TextArea />
      </div>
    </div>
  );
}
