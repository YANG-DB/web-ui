import test from "./test";

function getText(element) {
  return element.children[0].text;
}

function convertFilterBranchToProperty(element) {
  //TODO
  return {
    constraint: "",
    value: ""
  };
}

export default function slateToQuery(input) {
  const result = [
    {
      type: "Start",
      id: 0
    }
  ];
  function inner(element, branchingIndex) {
    if (element.type === "token") {
      if (element.variant === "alias") {
        result[result.length - 1].alias = getText(element);
        return;
      }
      const item = {
        properties: [],
        type: getText(element),
        id: result.length
      };
      if (element.variant === "relationship") {
        item.dir = "";
      }
      if (element.variant.includes("relationship_")) {
        item.dir = element.variant.replace("relationship_", "");
      }
      result.push(item);
    }
    if (element.children) {
      if (element.variant === "quantifier") {
        const index = result.length;
        result.push({
          type: "Quant",
          id: index,
          Type: element.children[0].children[0].text,
          next: []
        });
        element.children[1].children.forEach(el => {
          inner(el, index);
        });
      } else if (element.variant === "filter_group") {
        const index = result.length - 1;
        element.children[1].children.forEach(el => {
          inner(el, index);
        });
      } else {
        if (element.type === "branch" && element.variant !== "filter") {
          result[branchingIndex].next.push(result.length);
        }
        if (element.type === "branch" && element.variant === "filter") {
          result[branchingIndex].properties.push(
            convertFilterBranchToProperty(element)
          );
          return;
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
