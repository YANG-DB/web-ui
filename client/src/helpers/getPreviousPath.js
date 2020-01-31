import { BRANCH_DEPTH } from "./elements";

// expect(getPreviousPath([1, 1, 1, 0])).toEqual([1, 1, 0]);
// expect(getPreviousPath([1, 1, 0, 0])).toEqual([1, 0]);
// expect(getPreviousPath([1, 1, 0, 0], false)).toEqual(false);
// expect(getPreviousPath([1, 1, 1, 0], false)).toEqual([1, 1, 0]);

export default function getPreviousPath(currentPath, traverseBranches = true) {
  if (!traverseBranches) {
  }
  let i = currentPath.length - 1;
  while (i >= 0) {
    if (!traverseBranches && i <= currentPath.length - BRANCH_DEPTH) {
      break;
    }
    if (currentPath[i]) {
      return [...currentPath.slice(0, i), currentPath[i] - 1];
    }
    i--;
  }
  return [];
}
