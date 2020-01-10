import React, { useState, useCallback } from "react";
import moment from "moment";

import Month from "./Month";
import styles from "./DatePicker.module.css";

export const MONTH_INPUT_FORMAT = "YYYY-MM-DD";

function getWeekHeaders() {
  const weekHeaders = [<th key={"space"} />];
  for (let i = 0; i < 7; i++) {
    weekHeaders.push(
      <th key={i} className={styles.dayKeys}>
        {
          moment()
            .weekday(i)
            .format("dd")[0]
        }
      </th>
    );
  }
  return weekHeaders;
}

export default function DatePicker({ onSelect }) {
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [currentDate, setCurrentDate] = useState(null); // we will store this as a string

  const onDateSelect = useCallback(
    date => {
      const dateString = date.format(MONTH_INPUT_FORMAT);
      setCurrentDate(dateString);
      onSelect(dateString);
    },
    [onSelect]
  );

  function incrementMonth() {
    setCurrentMonth(currentMonth.clone().add(1, "month"));
  }

  function decrementMonth() {
    setCurrentMonth(currentMonth.clone().add(-1, "month"));
  }

  function incrementYear() {
    setCurrentMonth(currentMonth.clone().add(1, "year"));
  }

  function decrementYear() {
    setCurrentMonth(currentMonth.clone().add(-1, "year"));
  }

  return (
    <div>
      <div className={styles.weekHeaders}>
        <table>
          <tbody>
            <tr>{getWeekHeaders()}</tr>
          </tbody>
        </table>
      </div>
      <ul className={styles.list}>
        <Month
          month={currentMonth}
          onSelect={onDateSelect}
          selectedDate={currentDate && moment(currentDate, MONTH_INPUT_FORMAT)}
        />
      </ul>
      <button onClick={decrementMonth}>-- month</button>
      <button onClick={incrementMonth}>++ month</button>
      <button onClick={decrementYear}>-- year</button>
      <button onClick={incrementYear}>++ year</button>
    </div>
  );
}
