import * as queryConstants from "../constants/query";
import * as slateConstants from "../constants/slate";

function getText(element) {
  return element.children[0].text;
}

function convertFilterBranchToProperty(element) {
  const result = {};
  if (element.children[1]) {
    const constraint = getText(element.children[1]);
    result[queryConstants.CONSTRAINT] = constraint;
  }
  if (element.children[2]) {
    const value = getText(element.children[2]);
    result[queryConstants.VALUE] = value;
  }
  return result;
}

export default function slateToQuery(input) {
  let result = [
    {
      type: queryConstants.START,
      id: 0
    }
  ];
  const userAliases = {}; // use this to infer aliases
  const aliases = {};

  function checkAlias(letter) {
    if (!aliases[letter]) {
      aliases[letter] = 1;
    } else {
      aliases[letter]++;
    }
    const key = `${letter}${aliases[letter]}`;
    if (userAliases[key]) {
      return false;
    }
    return key;
  }
  function inner(element, branchingIndex) {
    if (element.type === slateConstants.TOKEN) {
      if (element.variant === slateConstants.ALIAS) {
        const alias = getText(element).replace(":", "");
        result[result.length - 1].alias = alias;
        userAliases[alias] = alias;
        return;
      }
      const item = {
        type: getText(element),
        id: result.length
      };
      if (element.variant === slateConstants.RELATIONSHIP) {
        item.dir = "";
      }
      if (element.variant.includes("relationship_")) {
        item.dir = element.variant.replace("relationship_", "");
      }
      result.push(item);
    }
    if (element.children) {
      if (element.variant === slateConstants.QUANTIFIER) {
        const index = result.length;
        result.push({
          type: queryConstants.QUANT,
          id: index,
          Type: element.children[0].children[0].text,
          next: []
        });
        element.children[1].children.forEach(el => {
          inner(el, index);
        });
      } else if (element.variant === slateConstants.FILTER_GROUP) {
        const index = result.length - 1;
        element.children[1].children.forEach(el => {
          inner(el, index);
        });
      } else {
        if (
          element.type === slateConstants.BRANCH &&
          element.variant !== slateConstants.FILTER
        ) {
          result[branchingIndex].next.push(result.length);
        }
        if (
          element.type === slateConstants.BRANCH &&
          element.variant === slateConstants.FILTER
        ) {
          const field = getText(element.children[0]);
          if (!result[branchingIndex].properties) {
            result[branchingIndex].properties = {};
          }
          result[branchingIndex].properties[
            field
          ] = convertFilterBranchToProperty(element);
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
  // now assign aliases to all tokens
  result = result.map(el => {
    if (
      ![queryConstants.QUANT, queryConstants.START].includes(el.type) &&
      !el.alias
    ) {
      const letter = el.type[0].toLowerCase();
      var key;
      for (; !key; key = checkAlias(letter)) {}
      return {
        ...el,
        alias: key
      };
    }
    return el;
  });
  return result;
}
