import { describe, expect, it, vi } from "vitest";
import { ColorParam, NumberParam, Params, p } from "../core/params";

describe("NumberParam", () => {
  it("can be constructed", () => {
    const np = new NumberParam(1);
    expect(np.value).toBe(1);
  });

  it("calls change events", () => {
    const np = new NumberParam(1);
    const onChange = vi.fn();
    np.onChange(onChange);
    np.value = 2;
    expect(onChange).toBeCalledWith(2);
  });
});

describe("Params", () => {
  it("can be constructed, get and set", () => {
    const params = new Params({
      foo: new NumberParam(1),
      nested: new Params({
        bar: new NumberParam(2),
      }),
    });

    expect(params.get("nested")).toBeInstanceOf(Params);
    expect(params.get("nested.bar")).toBeInstanceOf(NumberParam);
    expect(params.get("nested.bar").value).toBe(2);

    params.set("nested.bar", 3);
    expect(params.get("nested.bar").value).toBe(3);
  });

  it("calls change events", () => {
    const params = new Params({
      foo: new NumberParam(1),
      nested: new Params({
        bar: new NumberParam(2),
      }),
    });

    const onChange = vi.fn();
    params.on("change", onChange);
    params.get("foo").value = 3;
    expect(onChange).toBeCalledWith("foo", 3);
    params.set("nested.bar", 4);
    expect(onChange).toBeCalledWith("nested.bar", 4);
  });
});

describe("function p()", () => {
  it("can be used to construct Params", () => {
    const params = p({
      foo: p(1),
      nested: p({
        bgColor: p("#fff"),
        bar: p(2),
      }),
    });

    expect(params.get("nested")).toBeInstanceOf(Params);
    expect(params).toBeInstanceOf(Params);
    expect(params.get("nested.bgColor")).toBeInstanceOf(ColorParam);
    expect(params.get("nested.bar")).toBeInstanceOf(NumberParam);
    expect(params.get("foo").value).toBe(1);
    expect(params.get("nested.bar").value).toBe(2);
  });

  it("can be used to construct nested Params", () => {
    const params = p({
      foo: p(1),
      nested: p({
        bgColor: p("#fff"),
        bar: p(2),
        deepNestWithP: p({
          baz: p(3),
        }),
      }),
    });

    expect(params.values()).toStrictEqual({
      foo: 1,
      nested: {
        bgColor: "#fff",
        bar: 2,
        deepNestWithP: {
          baz: 3,
        },
      },
    });

    expect(params).toBeInstanceOf(Params);
    expect(params.get("nested")).toBeInstanceOf(Params);
    expect(params.get("nested.deepNestWithP")).toBeInstanceOf(Params);

    expect(params.get("nested.bgColor")).toBeInstanceOf(ColorParam);
    expect(params.get("nested.bar")).toBeInstanceOf(NumberParam);
    expect(params.get("foo").value).toBe(1);
    expect(params.get("nested")).toBeInstanceOf(Params);
    expect(params.get("nested.bar").value).toBe(2);
    expect(params.get("nested.deepNestWithP.baz").value).toBe(3);

    params.set({ foo: 42, nested: { deepNestWithP: { baz: 43 } } });

    expect(params.values()).toStrictEqual({
      foo: 42,
      nested: {
        bgColor: "#fff",
        bar: 2,
        deepNestWithP: {
          baz: 43,
        },
      },
    });
  });
});
