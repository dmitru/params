import type { Params } from "../../core";
import { IPlugin } from "../plugin";

declare module "../../core" {
  interface Params {
    /** Here, you can extend the types of the core library */
  }
}

export type ExamplePluginOpts = {
  /** An example option with a default */
  someOption: string;
};

const defaultOpts: ExamplePluginOpts = {
  someOption: "some default value",
};

export class ExamplePlugin implements IPlugin {
  constructor(opts: ExamplePluginOpts = defaultOpts) {}

  extend(instance: Params<any>): void {}
}
