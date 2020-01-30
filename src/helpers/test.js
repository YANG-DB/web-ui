export default [
  {
    children: [{ text: "Person", focussed: false }],
    type: "token",
    variant: "entity",
    valid: true,
    isFirst: true
  },
  {
    type: "group",
    variant: "filter_group",
    forType: "entity",
    children: [
      {
        type: "token",
        variant: "filter_label",
        children: [{ text: "ᗊ" }],
        focussed: false
      },
      {
        type: "group",
        variant: "filter_entries",
        children: [
          {
            type: "branch",
            variant: "filter",
            children: [
              {
                children: [{ text: "height", focussed: false }],
                type: "token",
                variant: "variable",
                valid: true,
                isFirst: true
              },
              {
                children: [{ text: "eq", focussed: false }],
                type: "token",
                variant: "operator",
                valid: true,
                isFirst: false
              },
              {
                children: [{ text: "100", focussed: false }],
                type: "token",
                variant: "value",
                valid: true,
                isFirst: false
              },
              { children: [{ text: "", focussed: false }] }
            ],
            path: [1, 1, 0]
          }
        ]
      }
    ]
  },
  {
    children: [{ text: "Know", focussed: false }],
    type: "token",
    variant: "relationship_in",
    valid: true,
    isFirst: false
  },
  {
    children: [{ text: "Person", focussed: false }],
    type: "token",
    variant: "entity",
    valid: true,
    isFirst: false
  },
  { children: [{ text: "", focussed: false }] }
];
