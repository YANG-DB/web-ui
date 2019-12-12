import React from "react";
import styles from "./App.module.css";

function App() {
  return (
    <div className={styles.app}>
      <div className={styles.query}>
        <input type="text" name="query" id="query" />
        <button type="submit">Go</button>
      </div>
    </div>
  );
}

export default App;
