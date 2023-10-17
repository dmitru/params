import type { PartialDeep, Get, Join } from "type-fest";

// Core recursive type to unwrap Params
type UnwrapParamValue<T> = {
  [K in keyof T]: T[K] extends BaseParam<infer U>
    ? U
    : T[K] extends Params<infer V>
    ? UnwrapParamValue<V>
    : never;
};
type UnwrapParam<T> = {
  [K in keyof T]: T[K] extends BaseParam<infer U>
    ? BaseParam<U>
    : T[K] extends Params<infer V>
    ? UnwrapParam<V>
    : never;
};
type DistributedKeyof<Target> = Target extends any ? keyof Target : never;

type DistributedAccess<Target, Key> = Target extends any
  ? Key extends keyof Target
    ? Target[Key]
    : undefined
  : never;

type Leaf = BaseParam<any>;

type DepthCounter = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

type ObjectPaths<
  Target,
  Depth extends DepthCounter[number] = 10
> = Depth extends never
  ? never
  : Target extends never
  ? never
  : Target extends Leaf
  ? never
  : {
      [Key in string & DistributedKeyof<Target>]:
        | [Key]
        | (NonNullable<
            DistributedAccess<Target, Key>
          > extends (infer ArrayItem)[]
            ?
                | [Key, number]
                | (ObjectPaths<
                    ArrayItem,
                    DepthCounter[Depth]
                  > extends infer V extends any[]
                    ? [Key, number, ...V]
                    : never)
            : ObjectPaths<
                NonNullable<DistributedAccess<Target, Key>>,
                DepthCounter[Depth]
              > extends infer V extends any[]
            ? [Key, ...V]
            : never);
    }[string & DistributedKeyof<Target>];

export abstract class BaseParam<T> {
  name: string = "";
  protected _value: T;
  private _callbacks: Array<(newValue: T) => void> = [];

  constructor(initialValue: T) {
    this._value = initialValue;
  }

  get value(): T {
    return this._value;
  }

  set value(v: T) {
    this._value = v;
    this._callbacks.forEach((cb) => cb(v));
  }

  onChange(callback: (newValue: T) => void): void {
    this._callbacks.push(callback);
  }

  offChange(callback: (newValue: T) => void): void {
    this._callbacks = this._callbacks.filter((cb) => cb !== callback);
  }
}

export class NumberParam extends BaseParam<number> {
  min: number;
  max: number;
  step: number;

  constructor(initialValue: number = 0, min = 0, max = 1, step = 0.001) {
    super(initialValue);
    this.min = min;
    this.max = max;
    this.step = step;
  }
}

export class ColorParam extends BaseParam<string> {
  constructor(value: string) {
    super(value);
  }
}

export type ParamDefinition = {
  [key: string]: BaseParam<any> | Params;
};

export class Params<T extends ParamDefinition = ParamDefinition> {
  def: T;
  private _changeCallbacks: Array<(key: string, newValue: any) => void> = [];

  constructor(def: T) {
    console.log("Params constructor", def);
    this.def = def;

    // Add listeners to nested Params and individual params
    for (let key in def) {
      const val = def[key];
      if (val instanceof BaseParam) {
        val.name = key;
        val.onChange((newValue) => {
          this._changeCallbacks.forEach((cb) => cb(`${key}`, newValue));
        });
      } else if (val instanceof Params) {
        val.on("change", (nestedKey, newValue) => {
          this._changeCallbacks.forEach((cb) =>
            cb(`${key}.${nestedKey}`, newValue)
          );
        });
      }
    }
  }

  set<Path extends Join<ObjectPaths<UnwrapParam<T>>, ".">>(
    path: Path,
    value: Get<UnwrapParamValue<T>, Path>
  ): void;
  set(update: PartialDeep<UnwrapParamValue<T>>): void;
  set(...args: any[]): void {
    if (args.length === 2 && typeof args[0] === "string") {
      const path = args[0];
      const value = args[1];
      const parts = path.split(".") as string[];
      let val: any = this.def;
      for (let part of parts) {
        if (val instanceof Params) {
          val = val.get(part);
        } else {
          val = val[part];
        }
      }
      if (val instanceof BaseParam) {
        val.value = value;
      }
    }

    if (args.length === 1 && typeof args[0] === "object") {
      const update = args[0];
      for (let key in update) {
        const val = (update as any)[key];
        const param = this.def[key];
        if (param instanceof BaseParam) {
          param.value = val;
        } else if (param instanceof Params) {
          param.set(val);
        }
      }
    }
  }

  get<Path extends Join<ObjectPaths<UnwrapParam<T>>, ".">>(
    path: Path
  ): Get<UnwrapParam<T>, Path> {
    const parts = path.split(".") as string[];
    let val: any = this.def;
    for (let part of parts) {
      if (val instanceof Params) {
        val = val.get(part);
      } else {
        val = val[part];
      }
    }
    return val;
  }

  on(event: string, callback: (key: string, newValue: any) => void) {
    if (event === "change") {
      this._changeCallbacks.push(callback);
    }
  }

  off(event: string, callback: (key: string, newValue: any) => void) {
    if (event === "change") {
      this._changeCallbacks = this._changeCallbacks.filter(
        (cb) => cb !== callback
      );
    }
  }

  values(): UnwrapParamValue<T> {
    const values: any = {};
    for (let key in this.def) {
      const val = this.def[key];
      if (val instanceof BaseParam) {
        values[key] = val.value;
      } else if (val instanceof Params) {
        values[key] = val.values();
      }
    }
    return values;
  }
}

export function p(value: string): ColorParam;
export function p(
  defVal: number,
  min?: number,
  max?: number,
  step?: number
): NumberParam;
export function p<T extends ParamDefinition>(def: T): Params<T>;
// export function p<T extends ParamDefinition>(name: string, def: T): Params<T>;
export function p<T extends ParamDefinition>(
  ...args: any[]
): Params<T> | BaseParam<any> {
  // Handle ColorParam
  if (args.length === 1 && typeof args[0] === "string") {
    return new ColorParam(args[0]);
  }

  // Handle NumberParam
  if (typeof args[0] === "number") {
    return new NumberParam(args[0], args[1], args[2], args[3]);
  }

  // Handle Params without a name
  if (args.length === 1 && typeof args[0] === "object") {
    if (args[0] instanceof Params) {
      return args[0];
    }
    // assume it's a ParamDefinition
    return new Params(args[0]);
  }

  // Handle Params with a name
  if (
    args.length === 2 &&
    typeof args[0] === "string" &&
    typeof args[1] === "object"
  ) {
    // Currently ignoring the name, but can be used for some purpose later
    if (args[1] instanceof Params) {
      return args[1];
    }
    // assume it's a ParamDefinition
    return new Params(args[1]);
  }

  throw new Error("Invalid arguments for p()");
}
