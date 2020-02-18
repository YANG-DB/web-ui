import resultsToTree from "./resultsToTree";

test("simple example", () => {
  const input = {
    pattern: {
      ont: "Knowledge",
      elements: [
        {
          type: "Start",
          id: 1
        },
        {
          type: "ETyped",
          eTag: "B",
          eType: "Entity",
          id: 2
        },
        {
          type: "Quant",
          qType: "all",
          next: [3, 5],
          id: 3
        },
        {
          type: "Rel",
          rType: "relatedEntity",
          dir: "R",
          id: 4
        },
        {
          type: "ETyped",
          eTag: "A",
          eType: "Entity",
          id: 5
        },
        {
          type: "Rel",
          rType: "hasEvalue",
          dir: "R",
          id: 6
        },
        {
          type: "ETyped",
          eTag: "C",
          eType: "Evalue",
          id: 7
        }
      ]
    },
    entities: [
      {
        eTag: ["A"],
        eID: "1",
        eType: "Entity"
      },
      {
        eTag: ["B"],
        eID: "2",
        eType: "Entity"
      },
      {
        eTag: ["C"],
        eID: "3",
        eType: "Evalue"
      }
    ],
    relationships: [
      {
        rID: "21",
        rType: "relatedEntity",
        directional: false,
        eID1: "2",
        eID2: "1",
        eTag1: "B",
        eTag2: "A"
      },
      {
        rID: "23",
        rType: "hasEvalue",
        directional: false,
        eID1: "2",
        eID2: "3",
        eTag1: "B",
        eTag2: "C"
      }
    ]
  };
  expect(resultsToTree(input)).toEqual({
    name: "2",
    alias: "B",
    link: null,
    children: [
      {
        name: "1",
        alias: "A",
        link: {
          label: "21",
          directional: false,
          type: "relatedEntity"
        }
      },
      {
        name: "3",
        alias: "C",
        link: {
          label: "23",
          directional: false,
          type: "hasEvalue"
        }
      }
    ]
  });
});
