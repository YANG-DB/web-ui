import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import NodeTable, { MAX_ROWS, scrollRowIntoView } from "./NodeTable";

const props = obj => Object.entries(obj).map(([pType, value]) => ({ pType, value }));
const nodes = [
  { id: "Person_61", type: "Person", name: "Christiana Schinner", rawId: "61", degree: 5, properties: props({ gender: "MALE", height: "181" }) },
  { id: "Person_15", type: "Person", name: "Pierce Wiza", rawId: "15", degree: 1, properties: props({ gender: "MALE", height: "175" }) },
  { id: "Dragon_1", type: "Dragon", name: "Dragon_1", rawId: "1", degree: 2, properties: props({ color: "BLUE" }) }
];
const colors = { Person: "#FF6B9D", Dragon: "#2ED573" };

const bodyRows = () => within(screen.getAllByRole("rowgroup")[1]).getAllByRole("row");

test("lists every node with the fixed and property columns", () => {
  render(<NodeTable nodes={nodes} selectedId={null} onSelect={() => {}} colors={colors} />);
  const headers = within(screen.getAllByRole("rowgroup")[0]).getAllByRole("columnheader").map(h => h.textContent).filter(Boolean);
  expect(headers).toEqual(["Type", "Name", "ID", "Relationships", "gender", "height", "color"]);
  expect(bodyRows()).toHaveLength(3);
  expect(screen.getByText("3 nodes")).toBeInTheDocument();
});

test("a filter per column, numeric comparisons, and clearing", () => {
  render(<NodeTable nodes={nodes} selectedId={null} onSelect={() => {}} colors={colors} />);
  fireEvent.change(screen.getByLabelText("Filter Type"), { target: { value: "person" } });
  expect(bodyRows()).toHaveLength(2);
  fireEvent.change(screen.getByLabelText("Filter Relationships"), { target: { value: "> 2" } });
  expect(bodyRows().map(r => r.textContent)).toEqual([expect.stringContaining("Christiana Schinner")]);
  expect(screen.getByText("1 of 3 nodes")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Filter Name"), { target: { value: "nobody" } });
  expect(screen.getByText("No node matches these filters.")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(bodyRows()).toHaveLength(3);
  expect(screen.queryByRole("button", { name: "Clear filters" })).toBeNull();
});

test("clicking a row or pressing Enter selects the node", () => {
  const onSelect = jest.fn();
  render(<NodeTable nodes={nodes} selectedId={null} onSelect={onSelect} colors={colors} />);
  fireEvent.click(screen.getByText("Pierce Wiza"));
  expect(onSelect).toHaveBeenLastCalledWith("Person_15");
  fireEvent.keyDown(screen.getByText("Dragon_1").closest("tr"), { key: "Enter" });
  expect(onSelect).toHaveBeenLastCalledWith("Dragon_1");
});

test("the node selected in the graph is marked", () => {
  const { rerender } = render(<NodeTable nodes={nodes} selectedId={null} onSelect={() => {}} colors={colors} />);
  rerender(<NodeTable nodes={nodes} selectedId="Dragon_1" onSelect={() => {}} colors={colors} />);
  expect(screen.getByText("Dragon_1").closest("tr")).toHaveAttribute("aria-selected", "true");
  expect(screen.getByText("Pierce Wiza").closest("tr")).toHaveAttribute("aria-selected", "false");
});

describe("scrollRowIntoView scrolls only the table, below its sticky header", () => {
  const container = { scrollTop: 100, clientHeight: 200 };
  test("a row hidden under the header scrolls down into view", () => {
    const c = { ...container };
    scrollRowIntoView(c, { offsetTop: 110, offsetHeight: 28 }, 56);
    expect(c.scrollTop).toBe(54);
  });
  test("a row below the view scrolls up into view", () => {
    const c = { ...container };
    scrollRowIntoView(c, { offsetTop: 400, offsetHeight: 28 }, 56);
    expect(c.scrollTop).toBe(228);
  });
  test("a visible row does not scroll", () => {
    const c = { ...container };
    scrollRowIntoView(c, { offsetTop: 200, offsetHeight: 28 }, 56);
    expect(c.scrollTop).toBe(100);
  });
  test("nothing to scroll", () => {
    expect(() => scrollRowIntoView(null, null)).not.toThrow();
  });
});

test("renders at most MAX_ROWS rows and says so", () => {
  const many = Array.from({ length: MAX_ROWS + 5 }, (_, i) => ({ id: `N_${i}`, type: "N", name: `n${i}`, rawId: String(i), degree: 0, properties: [] }));
  render(<NodeTable nodes={many} selectedId={null} onSelect={() => {}} colors={{}} />);
  expect(bodyRows()).toHaveLength(MAX_ROWS);
  expect(screen.getByText(new RegExp(`showing the first ${MAX_ROWS}`))).toBeInTheDocument();
});

test("no nodes", () => {
  render(<NodeTable nodes={[]} selectedId={null} onSelect={() => {}} colors={{}} />);
  expect(screen.getByText("No visible nodes.")).toBeInTheDocument();
});
