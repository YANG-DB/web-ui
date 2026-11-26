import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import GraphLegend from "./GraphLegend";

const items = [
  { type: "Person", count: 96, color: "#FF6B9D" },
  { type: "Dragon", count: 96, color: "#FF5E57" }
];

test("shows one chip per type with its count", () => {
  render(<GraphLegend items={items} hidden={new Set()} onToggle={() => {}} />);
  const person = screen.getByRole("button", { name: /Person/ });
  expect(person).toHaveTextContent("Person96");
  expect(person).toHaveAttribute("aria-pressed", "true");
  expect(screen.getAllByRole("button")).toHaveLength(2);
});

test("marks hidden types and reports clicks", () => {
  const onToggle = jest.fn();
  render(<GraphLegend items={items} hidden={new Set(["Dragon"])} onToggle={onToggle} />);
  const dragon = screen.getByRole("button", { name: /Dragon/ });
  expect(dragon).toHaveAttribute("aria-pressed", "false");
  expect(dragon).toHaveAttribute("title", "Show Dragon");
  fireEvent.click(dragon);
  expect(onToggle).toHaveBeenCalledWith("Dragon");
});

test("renders nothing without types", () => {
  const { container } = render(<GraphLegend items={[]} hidden={new Set()} onToggle={() => {}} />);
  expect(container).toBeEmptyDOMElement();
});
