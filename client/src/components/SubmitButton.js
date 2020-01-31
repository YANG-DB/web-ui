import React from "react";
import cn from "classnames";
import styles from "./TextInput.module.css";

export default function SubmitButton({ onSubmit }) {
  return (
    <button
      className={cn(styles.link, styles["link--arrowed"])}
      href="#"
      onClick={onSubmit}
    >
      <svg
        className={styles["arrow-icon"]}
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 32 32"
      >
        <g
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeMiterlimit="10"
        >
          <circle
            className={styles["arrow-icon--circle"]}
            cx="16"
            cy="16"
            r="15.12"
          ></circle>
          <path
            className={styles["arrow-icon--arrow"]}
            d="M16.14 9.93L22.21 16l-6.07 6.07M8.23 16h13.98"
          ></path>
        </g>
      </svg>
    </button>
  );
}
