import React from "react";
import { TextArea } from "./components";
import styles from "./App.module.css";

export default function App() {
  return (
    <div className={styles.app}>
      <TextArea />
    </div>
  );
}
