import { queryToSlate } from "../helpers";

export default function(results) {
  return {
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
        alias: "Ev",
        link: {
          label: "23",
          directional: false,
          type: "hasEvalue"
        }
      }
    ]
  };
}
