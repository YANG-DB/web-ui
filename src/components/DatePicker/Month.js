import React from "react";
import moment from "moment";
import Day from "./Day";
import getWeeks from "./getWeeks";

import styles from "./DatePicker.module.css";

export const MONTH_FORMAT = "MMMM";
export const YEAR_FORMAT = "YYYY";

export default function Month({ month, selectedDate }) {
  const weeks = month && getWeeks(month, false);
  return month ? (
    <div>
      <div className={styles.header}>
        <div className={styles.month}>{month.format(MONTH_FORMAT)}</div>
        <div className={styles.yearHeader}>{month.format(YEAR_FORMAT)}</div>
      </div>
      <table className={styles.content}>
        <tbody>
          {weeks.map((week, i) => (
            <tr key={i}>
              {week.map((day, k) => {
                if (moment.isMoment(day)) {
                  return <Day day={day} key={k} />;
                }
                return <td key={k} />;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div></div>
  );
}
