export default function getPreviousPath(currentPath) {
  let i = currentPath.length - 1;
  while (i >= 0) {
    if (currentPath[i]) {
      return [...currentPath.slice(0, i), currentPath[i] - 1];
    }
    i--;
  }
  return [];
}
