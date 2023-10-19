import type { Params } from "../core";

export interface IPlugin {
  extend(params: Params<any>): void;
}
