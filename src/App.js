import React from "react";
import { TextInput } from "./components";
import styles from "./App.module.css";

export default function App() {
  return (
    <div className={styles.app}>
      <TextInput />
    </div>
  );
}
