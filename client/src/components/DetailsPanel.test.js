import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import DetailsPanel from "./DetailsPanel";

const node = {
  kind: "node",
  id: "Dragon_100",
  type: "Dragon",
  name: "Bernard Essovius",
  color: "#2ED573",
  rawId: "100",
  degree: 3,
  expanded: false,
  properties: [
    { pType: "name", value: "Bernard Essovius" },
    { pType: "color", value: "WHITE" },
    { pType: "power", value: "29" }
  ]
};

const edge = {
  kind: "edge",
  id: "Own:dragon_1_69",
  type: "Own",
  name: "Prince Lind owns Dragon_1",
  source: { id: "Person_69", name: "Prince Lind" },
  target: { id: "Dragon_1", name: "Dragon_1" },
  directional: true,
  properties: []
};

function setup(details, extra = {}) {
  const handlers = { onClose: jest.fn(), onExpand: jest.fn(), onHide: jest.fn(), onSelectNode: jest.fn() };
  render(<DetailsPanel details={details} {...handlers} {...extra} />);
  return handlers;
}

test("a node shows its type, name, id, degree and every property", () => {
  setup(node);
  const panel = screen.getByRole("complementary", { name: "Node details" });
  expect(within(panel).getByText("Dragon")).toBeInTheDocument();
  expect(within(panel).getByRole("heading", { name: "Bernard Essovius" })).toBeInTheDocument();
  expect(within(panel).getByText("100")).toBeInTheDocument();
  expect(within(panel).getByText("3 in this graph")).toBeInTheDocument();
  const rows = within(panel).getAllByRole("row").map(r => r.textContent);
  expect(rows).toEqual(["nameBernard Essovius", "colorWHITE", "power29"]);
});

test("node actions: expand, collapse label, pending state, hide", () => {
  const h = setup(node);
  fireEvent.click(screen.getByRole("button", { name: "Expand neighbors" }));
  expect(h.onExpand).toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Hide" }));
  expect(h.onHide).toHaveBeenCalled();
});

test("an expanded node offers to collapse, and expanding is disabled while pending", () => {
  const { rerender } = render(
    <DetailsPanel details={{ ...node, expanded: true }} onClose={() => {}} onExpand={() => {}} onHide={() => {}} onSelectNode={() => {}} />
  );
  expect(screen.getByRole("button", { name: "Collapse neighbors" })).toBeEnabled();
  rerender(<DetailsPanel details={node} expanding onClose={() => {}} onExpand={() => {}} onHide={() => {}} onSelectNode={() => {}} />);
  expect(screen.getByRole("button", { name: "Expanding…" })).toBeDisabled();
});

test("an edge shows its ends as buttons that select the node", () => {
  const h = setup(edge);
  const panel = screen.getByRole("complementary", { name: "Relationship details" });
  expect(within(panel).getByText("Own relationship")).toBeInTheDocument();
  expect(within(panel).getByText("From → To")).toBeInTheDocument();
  expect(within(panel).queryByRole("button", { name: /Expand/ })).toBeNull();
  expect(within(panel).getByText("No properties.")).toBeInTheDocument();
  fireEvent.click(within(panel).getByRole("button", { name: "Prince Lind" }));
  expect(h.onSelectNode).toHaveBeenCalledWith("Person_69");
});

test("Escape and the close button close the panel; focus starts on close", () => {
  const h = setup(node);
  expect(screen.getByRole("button", { name: "Close details" })).toHaveFocus();
  fireEvent.keyDown(window, { key: "Escape" });
  fireEvent.click(screen.getByRole("button", { name: "Close details" }));
  expect(h.onClose).toHaveBeenCalledTimes(2);
});

test("shows an error and renders nothing without details", () => {
  setup(node, { error: "Could not expand: boom" });
  expect(screen.getByRole("alert")).toHaveTextContent("boom");
  const { container } = render(
    <DetailsPanel details={null} onClose={() => {}} onExpand={() => {}} onHide={() => {}} onSelectNode={() => {}} />
  );
  expect(container).toBeEmptyDOMElement();
});
