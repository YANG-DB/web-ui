import React from "react";
import logo from "../assets/logo.png";
import icon from "../assets/hamburger.png";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <div className={styles.header}>
      <img src={icon} alt="menu" className={styles.menu} />
      <img src={logo} alt="logo" className={styles.logo} />
    </div>
  );
}
