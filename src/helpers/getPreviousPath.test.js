import getPreviousPath from "./getPreviousPath";

test("get previous path", () => {
  expect(getPreviousPath([1, 1, 1, 0])).toEqual([1, 1, 0]);
});

test("get previous path", () => {
  expect(getPreviousPath([1, 1, 0, 0])).toEqual([1, 0]);
});
