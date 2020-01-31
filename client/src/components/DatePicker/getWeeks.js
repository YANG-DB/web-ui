// The MIT License (MIT)

// Copyright (c) 2016 Airbnb

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import moment from "moment";

// Adapted from airbnb/react-dates/src/utils/getCalendarMonthWeeks
const getWeeks = (month, enableOutsideDays) => {
  // set utc offset to get correct dates in future (when timezone changes)
  const baseDate = month.clone();
  const firstOfMonth = baseDate
    .clone()
    .startOf("month")
    .hour(12);
  const lastOfMonth = baseDate
    .clone()
    .endOf("month")
    .hour(12);

  const currentDay = firstOfMonth.clone();
  let currentWeek = [];
  const weeksInMonth = [];

  // days belonging to the previous month
  for (let i = 0; i < currentDay.weekday(); i += 1) {
    const prevDay = enableOutsideDays
      ? currentDay.clone().subtract(i + 1, "day")
      : null;
    currentWeek.unshift(prevDay);
  }

  while (currentDay < lastOfMonth) {
    currentWeek.push(currentDay.clone());
    currentDay.add(1, "d");

    if (currentDay.weekday() === 0) {
      weeksInMonth.push(currentWeek);
      currentWeek = [];
    }
  }

  // weekday() returns the index of the day of the week according to the locale
  if (currentDay.weekday() !== 0) {
    // days belonging to the next month
    for (let k = currentDay.weekday(), count = 0; k < 7; k += 1, count += 1) {
      const nextDay = enableOutsideDays
        ? currentDay.clone().add(count, "day")
        : null;
      currentWeek.push(nextDay);
    }

    weeksInMonth.push(currentWeek);
  }

  // Add month indices
  weeksInMonth.forEach(weekArray => {
    const w = weekArray.find(ob => moment.isMoment(ob));
    weekArray.unshift(w.weeks());
  });
  return weeksInMonth;
};

export default getWeeks;
