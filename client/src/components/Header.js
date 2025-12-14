import React from "react";
import { NavLink } from "react-router-dom";
import logo from "../assets/logo.png";
import icon from "../assets/hamburger.svg";
import styles from "./Header.module.css";

export default function Header({ links }) {
  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <img src={icon} alt="menu" className={styles.menu} />
        <img src={logo} alt="logo" className={styles.logo} />
      </div>
      <div className={styles.center}>
        {Object.keys(links).map(l => (
          <NavLink
            key={l}
            to={`/${links[l]}`}
            className={styles.link}
            activeClassName={styles.active}
          >
            {l}
          </NavLink>
        ))}
      </div>
      <div className={styles.right}>Hi Lior</div>
    </div>
  );
}
