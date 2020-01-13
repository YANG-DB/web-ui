import React, { useState, useCallback } from "react";
import moment from "moment";

import Month from "./Month";
import styles from "./DatePicker.module.css";

import xCircle from "../../assets/x-circle.svg";

import { MONTH_INPUT_FORMAT, DateContext } from "../DatePicker";

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

export default function DatePickerRange({ onSelect }) {
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [hoveredDate, setHoveredDate] = useState(null);
  const [currentDateStart, setCurrentDateStart] = useState(null); // we will store this as a string
  const [currentDateEnd, setCurrentDateEnd] = useState(null); // we will store this as a string

  const onDateSelect = useCallback(
    date => {
      const dateString = date.format(MONTH_INPUT_FORMAT);
      if (!currentDateStart) {
        setCurrentDateStart(dateString);
      } else {
        setCurrentDateEnd(dateString);
        onSelect(`${currentDateStart} - ${dateString}`, true);
      }
    },
    [currentDateStart, setCurrentDateStart, setCurrentDateEnd, onSelect]
  );

  const onHover = useCallback(
    date => {
      setHoveredDate(date);
    },
    [setHoveredDate]
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
      <DateContext.Provider
        value={{
          selectedDate: currentDateStart,
          onSelect: onDateSelect,
          onHover: setHoveredDate,
          hoveredDate
        }}
      >
        <div className={styles.rangeHeader}>
          {currentDateStart ? (
            <span className={styles.tempDate}>
              <span className={styles.tempDateInner}>
                {`${currentDateStart}`}
                <button onClick={() => setCurrentDateStart(null)}>
                  <img src={xCircle} alt="" />
                </button>{" "}
              </span>
            </span>
          ) : (
            <p>Select start date</p>
          )}
        </div>
        <div className={styles.weekHeaders}>
          <table>
            <tbody>
              <tr>{getWeekHeaders()}</tr>
            </tbody>
          </table>
        </div>
        <ul className={styles.list}>
          <Month month={currentMonth} />
        </ul>
        <div className={styles.buttons}>
          <div>
            <button onClick={decrementYear}>{"<<"}</button>
            <button onClick={decrementMonth}>{"<"}</button>
          </div>
          <div>
            <button onClick={incrementMonth}>{">"}</button>
            <button onClick={incrementYear}>{">>"}</button>
          </div>
        </div>
      </DateContext.Provider>
    </div>
  );
}
