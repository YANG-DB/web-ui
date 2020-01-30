import test from "./test";

export default function slateToQuery(input) {
  const result = [];
  function inner(element, branchingIndex) {
    if (element.type === "token") {
      result.push({
        type: element.variant,
        id: result.length,
        branch: branchingIndex
      });
    }
    if (element.children) {
      if (element.variant === "quantifier") {
        const index = result.length;
        result.push({
          type: "Quant",
          id: index,
          variant: element.children[0].children[0].text,
          next: []
        });
        element.children[1].children.forEach(el => {
          inner(el, index);
        });
      } else {
        if (element.type === "branch") {
          result[branchingIndex].next.push(result.length);
        }
        element.children.forEach(el => {
          inner(el, branchingIndex);
        });
      }
    }
    return;
  }
  input.forEach(el => inner(el));
  return result;
}

console.log("Test: ", slateToQuery(test));
