import { describe, it, expect, vi } from "vitest";
import { ColorParam, NumberParam, Params, p } from "../params";

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
  it("can be constructed", () => {
    const params = new Params({
      foo: new NumberParam(1),
      nested: {
        bar: new NumberParam(2),
      },
    });

    const nestedParams = params.getParam("nested");

    expect(params.getParam("foo")!.value).toBe(1);
    expect(params.getParam("nested")!).toBeInstanceOf(Params);
    expect(params.getParam("nested.bar")!).toBeInstanceOf(NumberParam);
    expect(params.getParam("nested.bar")!.value).toBe(2);
  });

  it("calls change events", () => {
    const params = new Params({
      foo: new NumberParam(1),
      nested: {
        bar: new NumberParam(2),
      },
    });

    const onChange = vi.fn();
    params.on("change", onChange);
    params.getParam("foo")!.value = 3;
    expect(onChange).toBeCalledWith("foo", 3);
    params.getParam("nested.bar")!.value = 4;
    expect(onChange).toBeCalledWith("nested.bar", 4);
  });
});

describe("function p()", () => {
  it("can be used to construct Params", () => {
    const params = p({
      foo: p(1),
      nested: {
        bgColor: p("#fff"),
        bar: p(2),
      },
    });

    expect(params.getParam("nested")).toBeInstanceOf(Params);
    expect(params).toBeInstanceOf(Params);
    expect(params.getParam("nested.bgColor")).toBeInstanceOf(ColorParam);
    expect(params.getParam("nested.bar")).toBeInstanceOf(NumberParam);
    expect(params.getParam("foo").value).toBe(1);
    expect(params.getParam("nested.bar")!.value).toBe(2);
  });

  it("can be used to construct nested Params", () => {
    const params = p({
      foo: p(1),
      nested: {
        bgColor: p("#fff"),
        bar: p(2),
        deepNestWithP: p({
          baz: p(3),
        }),
        deepNestWithoutP: {
          baz: p(3),
        },
      },
    });

    expect(params).toBeInstanceOf(Params);
    expect(params.getParam("nested")).toBeInstanceOf(Params);
    expect(params.getParam("nested.deepNestWithP")).toBeInstanceOf(Params);
    expect(params.getParam("nested.deepNestWithoutP")).toBeInstanceOf(Params);

    expect(params.getParam("nested.bgColor")!).toBeInstanceOf(ColorParam);
    expect(params.getParam("nested.bar")!).toBeInstanceOf(NumberParam);
    expect(params.getParam("foo")!.value).toBe(1);
    expect(params.get("nested")).toBeInstanceOf(Params);
    expect(params.getParam("nested.bar")!.value).toBe(2);
    expect(params.getParam("nested.deepNestWithP.baz")!.value).toBe(3);
    expect(params.getParam("nested.deepNestWithoutP.baz")!.value).toBe(3);
  });
});
