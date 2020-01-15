import React from "react";
import icon from "../assets/menu.svg";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <div className={styles.header}>
      <img src={icon} alt="menu" />
    </div>
  );
}
