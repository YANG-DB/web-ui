import * as slateConstants from "../constants/slate";

export function textNode(text = "", opts = {}) {
  return {
    ...opts,
    children: [
      {
        text
      }
    ]
  };
}

export function quantifier(type) {
  return {
    type: slateConstants.GROUP,
    variant: slateConstants.QUANTIFIER,
    children: [
      {
        type: slateConstants.TOKEN,
        variant: slateConstants.QUANTIFIER_LABEL,
        children: [
          {
            text: type
          }
        ]
      },
      {
        type: slateConstants.GROUP,
        variant: slateConstants.QUANTIFIER_ENTRIES,
        children: [
          {
            type: slateConstants.BRANCH,
            variant: slateConstants.QUANTIFIER_ENTRY,
            children: [textNode()]
          }
        ]
      }
    ]
  };
}

export function filter(forType) {
  return {
    type: slateConstants.GROUP,
    variant: slateConstants.FILTER_GROUP,
    forType,
    children: [
      {
        type: slateConstants.TOKEN,
        variant: slateConstants.FILTER_LABEL,
        children: [
          {
            text: slateConstants.FILTER_ICON
          }
        ]
      },
      {
        type: slateConstants.GROUP,
        variant: slateConstants.FILTER_ENTRIES,
        children: [
          {
            type: slateConstants.BRANCH,
            variant: slateConstants.FILTER,
            children: [
              {
                children: [
                  {
                    text: ""
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  };
}

export const GROUP_DEPTH = 5;
export const BRANCH_DEPTH = 3;
