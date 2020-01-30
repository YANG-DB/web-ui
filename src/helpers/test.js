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
    variant: "quantifier",
    children: [
      {
        type: "token",
        variant: "quantifier_label",
        children: [{ text: "&" }],
        focussed: false
      },
      {
        type: "group",
        variant: "quantifier_entries",
        children: [
          {
            type: "branch",
            variant: "quantifier_entry",
            children: [
              {
                children: [{ text: "Know", focussed: false }],
                type: "token",
                variant: "relationship_in",
                valid: true,
                isFirst: true
              },
              {
                children: [{ text: "Person", focussed: false }],
                type: "token",
                variant: "entity",
                valid: true,
                isFirst: false
              },
              { children: [{ text: "", focussed: false }] }
            ],
            path: [1, 1, 0]
          },
          {
            variant: "quantifier_entry",
            type: "branch",
            children: [
              {
                children: [{ text: "Know", focussed: false }],
                type: "token",
                variant: "relationship_in",
                valid: true,
                isFirst: true
              },
              {
                children: [{ text: "Person", focussed: false }],
                type: "token",
                variant: "entity",
                valid: true,
                isFirst: false
              },
              {
                type: "group",
                variant: "quantifier",
                children: [
                  {
                    type: "token",
                    variant: "quantifier_label",
                    children: [{ text: "||" }],
                    focussed: false
                  },
                  {
                    type: "group",
                    variant: "quantifier_entries",
                    children: [
                      {
                        type: "branch",
                        variant: "quantifier_entry",
                        children: [
                          {
                            children: [{ text: "Know", focussed: false }],
                            type: "token",
                            variant: "relationship_in",
                            valid: true,
                            isFirst: true
                          },
                          {
                            children: [{ text: "Person", focussed: false }],
                            type: "token",
                            variant: "entity",
                            valid: true,
                            isFirst: false
                          },
                          { children: [{ text: "", focussed: false }] }
                        ],
                        path: [1, 1, 1, 2, 1, 0]
                      },
                      {
                        variant: "quantifier_entry",
                        type: "branch",
                        children: [
                          {
                            children: [{ text: "Know", focussed: false }],
                            type: "token",
                            variant: "relationship_in",
                            valid: true,
                            isFirst: true
                          },
                          {
                            children: [{ text: "Guy", focussed: false }],
                            type: "token",
                            variant: "entity",
                            valid: true,
                            isFirst: false
                          },
                          { children: [{ text: "", focussed: false }] }
                        ],
                        path: [1, 1, 1, 2, 1, 1]
                      }
                    ]
                  }
                ]
              }
            ],
            path: [1, 1, 1]
          }
        ]
      }
    ]
  }
];
