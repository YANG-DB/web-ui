import { formatValue, propertyRows } from "./elementDetails";

test("formatValue", () => {
  expect(formatValue("BLACK")).toBe("BLACK");
  expect(formatValue(29)).toBe("29");
  expect(formatValue(false)).toBe("false");
  expect(formatValue(null)).toBe("—");
  expect(formatValue(undefined)).toBe("—");
  expect(formatValue("")).toBe("—");
  expect(formatValue([])).toBe("—");
  expect(formatValue(["procedure.1", "procedure.2"])).toBe("procedure.1, procedure.2");
  expect(formatValue({ lat: 1, lon: 2 })).toBe('{"lat":1,"lon":2}');
});

test("propertyRows keeps Fuse's order and the first value of a repeated name", () => {
  expect(
    propertyRows([
      { pType: "color", agg: "raw", value: "WHITE" },
      { pType: "name", agg: "raw", value: "Bernard Essovius" },
      { pType: "color", agg: "raw", value: "RED" },
      { pType: "refs", agg: "raw" },
      { agg: "raw", value: "no name" },
      null
    ])
  ).toEqual([
    { name: "color", value: "WHITE" },
    { name: "name", value: "Bernard Essovius" },
    { name: "refs", value: "—" }
  ]);
  expect(propertyRows(undefined)).toEqual([]);
});
