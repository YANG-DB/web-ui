import slateToQuery from "./slateToQuery";

test("Person Know< Person", () => {
  expect(
    slateToQuery([
      {
        children: [{ text: "Person", focussed: false }],
        type: "token",
        variant: "entity",
        valid: true,
        isFirst: true
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
    ])
  ).toEqual([
    {
      children: [{ text: "Person", focussed: false }],
      type: "token",
      variant: "entity",
      valid: true,
      isFirst: true
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
  ]);
});

test("Person <Know (filter) Person", () => {
  expect(
    slateToQuery([
      {
        children: [{ text: "Person", focussed: false }],
        type: "token",
        variant: "entity",
        valid: true,
        isFirst: true
      },
      {
        children: [{ text: "Know", focussed: false }],
        type: "token",
        variant: "relationship_in",
        valid: true,
        isFirst: false
      },
      {
        type: "group",
        variant: "filter_group",
        forType: "relationship_in",
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
                    children: [{ text: "startDate", focussed: false }],
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
                    children: [{ text: "2020-01-15", focussed: false }],
                    type: "token",
                    variant: "value",
                    valid: true,
                    isFirst: false
                  },
                  { children: [{ text: "", focussed: false }] }
                ],
                path: [2, 1, 0]
              }
            ]
          }
        ]
      },
      {
        children: [{ text: "Person", focussed: false }],
        type: "token",
        variant: "entity",
        valid: true,
        isFirst: false
      },
      { children: [{ text: "", focussed: false }] }
    ])
  ).toEqual([
    {
      children: [{ text: "Person", focussed: false }],
      type: "token",
      variant: "entity",
      valid: true,
      isFirst: true
    },
    {
      children: [{ text: "Know", focussed: false }],
      type: "token",
      variant: "relationship_in",
      valid: true,
      isFirst: false
    },
    {
      type: "group",
      variant: "filter_group",
      forType: "relationship_in",
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
                  children: [{ text: "startDate", focussed: false }],
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
                  children: [{ text: "2020-01-15", focussed: false }],
                  type: "token",
                  variant: "value",
                  valid: true,
                  isFirst: false
                },
                { children: [{ text: "", focussed: false }] }
              ],
              path: [2, 1, 0]
            }
          ]
        }
      ]
    },
    {
      children: [{ text: "Person", focussed: false }],
      type: "token",
      variant: "entity",
      valid: true,
      isFirst: false
    },
    { children: [{ text: "", focussed: false }] }
  ]);
});

test("Person & (Know< Person, MemberOf< Guild)", () => {
  expect([
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
                  children: [{ text: "MemberOf", focussed: false }],
                  type: "token",
                  variant: "relationship_out",
                  valid: true,
                  isFirst: true
                },
                {
                  children: [{ text: "Guild", focussed: false }],
                  type: "token",
                  variant: "entity",
                  valid: true,
                  isFirst: false
                },
                { children: [{ text: "", focussed: false }] }
              ],
              path: [1, 1, 1]
            }
          ]
        }
      ]
    }
  ]).toEqual([
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
                  children: [{ text: "MemberOf", focussed: false }],
                  type: "token",
                  variant: "relationship_out",
                  valid: true,
                  isFirst: true
                },
                {
                  children: [{ text: "Guild", focussed: false }],
                  type: "token",
                  variant: "entity",
                  valid: true,
                  isFirst: false
                },
                { children: [{ text: "", focussed: false }] }
              ],
              path: [1, 1, 1]
            }
          ]
        }
      ]
    }
  ]);
});
