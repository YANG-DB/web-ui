import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

beforeAll(() => {
  window.getSelection = () => {
    return {
      removeAllRanges: () => {}
    };
  };
});

it("renders without crashing", () => {
  const div = document.createElement("div");
  ReactDOM.render(<App />, div);
});
