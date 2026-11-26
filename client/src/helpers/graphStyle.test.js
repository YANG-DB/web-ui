import {
  PALETTE,
  KNOWN_TYPE_COLORS,
  buildTypeColors,
  displayName,
  typeBadge,
  nodeSize,
  countByType
} from "./graphStyle";

const props = obj => Object.entries(obj).map(([pType, value]) => ({ pType, agg: "raw", value }));

describe("buildTypeColors", () => {
  test("known types keep their fixed colour", () => {
    expect(buildTypeColors(["Person", "Dragon"])).toEqual({
      Person: KNOWN_TYPE_COLORS.Person,
      Dragon: KNOWN_TYPE_COLORS.Dragon
    });
  });

  test("unknown types get distinct, unused palette colours", () => {
    const colors = buildTypeColors(["Person", "Airline", "Route", "Gate"]);
    const values = Object.values(colors);
    expect(new Set(values).size).toBe(4);
    ["Airline", "Route", "Gate"].forEach(t => expect(PALETTE).toContain(colors[t]));
    expect(colors.Airline).not.toBe(colors.Person);
  });

  test("two known types that share a colour do not collide in one result", () => {
    // Flight and Kingdom are both blue; whichever comes second gets another colour
    const colors = buildTypeColors(["Kingdom", "Flight"]);
    expect(colors.Kingdom).toBe(KNOWN_TYPE_COLORS.Kingdom);
    expect(colors.Flight).not.toBe(colors.Kingdom);
  });

  test("more types than colours cycles through the palette", () => {
    const types = Array.from({ length: PALETTE.length + 3 }, (_, i) => `T${i}`);
    const colors = buildTypeColors(types);
    expect(Object.keys(colors)).toHaveLength(types.length);
    Object.values(colors).forEach(c => expect(PALETTE).toContain(c));
  });

  test("ignores empty and repeated types", () => {
    expect(Object.keys(buildTypeColors(["A", "A", null, undefined, ""]))).toEqual(["A"]);
    expect(buildTypeColors(undefined)).toEqual({});
  });
});

describe("displayName", () => {
  test("prefers name", () => {
    expect(displayName({ properties: props({ name: "Nikita VonRueden", firstName: "Nikita" }) })).toBe("Nikita VonRueden");
  });

  test("then title", () => {
    expect(displayName({ properties: props({ title: "Engineer", foo: "bar" }) })).toBe("Engineer");
  });

  test("then firstName plus lastName", () => {
    expect(displayName({ properties: props({ firstName: "Braden", lastName: "Heaney" }) })).toBe("Braden Heaney");
    expect(displayName({ properties: props({ lastName: "Heaney" }) })).toBe("Heaney");
  });

  test("then the first text property that is not an id, a date or an enum value", () => {
    expect(
      displayName({ properties: props({ code: "123", birthDate: "1968-10-03 08:52:15.000", color: "BLACK", motto: "Fire and blood" }) })
    ).toBe("Fire and blood");
  });

  test("an enum value is not a name: a Dragon with only colour and gender shows its id", () => {
    expect(
      displayName({ eID: "Dragon_1", id: "1", properties: props({ color: "BLUE", gender: "MALE", power: "12" }) })
    ).toBe("Dragon_1");
  });

  test("falls back to the id", () => {
    expect(displayName({ id: "100", eID: "Dragon_100", properties: props({ power: 29 }) })).toBe("Dragon_100");
    expect(displayName({ id: "100" })).toBe("100");
    expect(displayName({ eID: "e1.default" })).toBe("e1.default");
    expect(displayName(null)).toBe("");
  });

  test("skips empty values and joins arrays", () => {
    expect(displayName({ properties: props({ name: "  ", title: ["a", "b"] }) })).toBe("a, b");
  });

  test("truncates long names", () => {
    const name = displayName({ properties: props({ name: "A".repeat(40) }) }, 10);
    expect(name).toHaveLength(10);
    expect(name.endsWith("…")).toBe(true);
  });
});

describe("typeBadge", () => {
  test("is an SVG data URI with the escaped type name", () => {
    const uri = typeBadge("A<B");
    expect(uri.startsWith("data:image/svg+xml;utf8,")).toBe(true);
    const svg = decodeURIComponent(uri.slice("data:image/svg+xml;utf8,".length));
    expect(svg).toContain(">A&lt;B</text>");
  });

  test("shrinks the font for long type names", () => {
    const size = uri => Number(decodeURIComponent(uri).match(/font-size="(\d+)"/)[1]);
    expect(size(typeBadge("Profession"))).toBeLessThan(size(typeBadge("Kin")));
    expect(size(typeBadge("AVeryVeryLongEntityTypeName"))).toBeGreaterThanOrEqual(9);
  });
});

test("nodeSize grows with degree and stays in range", () => {
  expect(nodeSize(0, 10)).toBe(36);
  expect(nodeSize(10, 10)).toBe(80);
  expect(nodeSize(5, 10)).toBeGreaterThan(36);
  expect(nodeSize(3, 0)).toBe(36);
});

test("countByType counts in order of first appearance", () => {
  expect(countByType([{ eType: "Person" }, { eType: "Dragon" }, { eType: "Person" }])).toEqual([
    { type: "Person", count: 2 },
    { type: "Dragon", count: 1 }
  ]);
  expect(countByType(undefined)).toEqual([]);
});
