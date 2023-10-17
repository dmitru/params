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

type ParamType = ParamDefinition;
export type ParamDefinition = {
  [key: string]: Params<any> | ParamType | BaseParam<any>;
};

// type ParamTypes = BaseParam<any> | Params;

// export type ParamDefinition = {
//   [key: string]: ParamTypes | ParamDefinition;
// };

export class Params<T extends ParamDefinition = ParamDefinition> {
  private _def: T;
  private _changeCallbacks: Array<(key: string, newValue: any) => void> = [];

  constructor(def: T) {
    console.log("Params constructor", def);
    this._def = def;

    // Add listeners to nested Params and individual params
    for (let key in def) {
      const val = def[key];
      if (val instanceof BaseParam) {
        val.onChange((newValue) => {
          this._changeCallbacks.forEach((cb) => cb(key, newValue));
        });
      } else if (val instanceof Params) {
        val.on("change", (nestedKey, newValue) => {
          this._changeCallbacks.forEach((cb) =>
            cb(`${key}.${nestedKey}`, newValue)
          );
        });
      } else if (typeof val === "object") {
        // assume it's a ParamDefinition
        const nestedParams = new Params(val as ParamDefinition);
        this._def[key] = nestedParams;
        nestedParams.on("change", (nestedKey, newValue) => {
          this._changeCallbacks.forEach((cb) =>
            cb(`${key}.${nestedKey}`, newValue)
          );
        });
      }
    }
  }

  getParam<Key extends KeyOfDeep<T>>(path: Key): TypeOfDeepKey<T, Key> {
    const parts = path.split(".") as string[];
    let val: any = this._def;
    for (let part of parts) {
      if (val instanceof Params) {
        val = val.getParam(part);
      } else {
        val = val[part];
      }
    }
    return val;
  }

  get = (path: string): Params | BaseParam<any> | undefined => {
    const parts = path.split(".");
    let val: any = this._def;
    for (let part of parts) {
      if (val instanceof Params) {
        val = val.getParam(part);
      } else {
        val = val[part];
      }
    }
    return val;
  };

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

  set(newData: Partial<ParamDefinition>): void {
    for (let key in newData) {
      const val = newData[key];
      const oldVal = this._def[key];
      if (oldVal instanceof BaseParam && val instanceof BaseParam) {
        oldVal.value = val.value;
      }
    }
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
export function p<T extends ParamDefinition>(name: string, def: T): Params<T>;
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

// Extracts deeply nested keys from an object
type KeyOfDeep<T> = {
  [K in keyof T]: K extends string
    ? T[K] extends ParamType
      ? K | `${K}.${KeyOfDeep<T[K]>}`
      : K
    : never;
}[keyof T];

// Given a deep key, extract the corresponding type
type TypeOfDeepKey<
  T,
  Key extends string
> = Key extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends KeyOfDeep<T[K]>
      ? TypeOfDeepKey<T[K], Rest>
      : never
    : never
  : Key extends keyof T
  ? T[Key]
  : never;
