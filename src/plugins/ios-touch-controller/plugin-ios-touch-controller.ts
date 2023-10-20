import {
  NumberParam,
  type BaseParam,
  type Params,
  ParamDefinition,
} from "../../core";
import { IPlugin } from "../plugin";

import { ControlSurface, Controller } from "./ios-controller-client";

interface ParamsTouchControllerApi {
  /** Adds all defined params to the touch controller as a flat list of controls */
  clear(): void;
  addAll(): void;
  addPage(def: LayoutPageInitArgs): void;
  restore(): void;
}

declare module "../../core" {
  interface Params {
    /** Here, you can extend the types of the core library */
    touchController: ParamsTouchControllerApi;
  }
}

export type IosControllerPluginOpts = {
  /** An example option with a default */
  someOption: string;
};

const defaultOpts: IosControllerPluginOpts = {
  someOption: "some default value",
};

class TouchControllerApi implements ParamsTouchControllerApi {
  params: Params<ParamDefinition>;
  plugin: IosControllerPlugin;

  constructor(params: Params<ParamDefinition>, plugin: IosControllerPlugin) {
    this.params = params;
    this.plugin = plugin;
  }

  restore = () => this.plugin.restore();
  clear = () => this.plugin.clear();
  addAll = () => this.plugin.addAll();
  addPage = (def: LayoutPageInitArgs) => this.plugin.addPage(def);
}

class Layout {
  pages: LayoutPage[];
  currentPageId?: string;

  constructor() {
    this.pages = [];
    this.currentPageId = undefined;
  }

  get isEmpty() {
    return this.pages.length === 0;
  }

  get currentPage(): LayoutPage | undefined {
    if (!this.currentPageId) return;
    return this.getPageById(this.currentPageId);
  }

  getPageById(id: string): LayoutPage | undefined {
    return this.pages.find((p) => p.id === id);
  }

  clear() {
    this.pages = [];
    this.currentPageId = undefined;
  }

  setCurrentPage = (id: string) => {
    const page = this.getPageById(id);
    if (page) {
      this.currentPageId = page.id;
    }
  };

  createPage(args: LayoutPageInitArgs): LayoutPage {
    const page = new LayoutPage(this, args);
    this.pages.push(page);
    return page;
  }
}

type LayoutPageInitArgs = { id: string; controlIds?: string[] };
class LayoutPage {
  id: string;
  controlIds: string[];
  layout: Layout;

  constructor(layout: Layout, args: LayoutPageInitArgs) {
    this.layout = layout;
    this.id = args.id;
    this.controlIds = args.controlIds ?? [];
  }
}

export class IosControllerPlugin implements IPlugin {
  controller: Controller;
  paramsPage = 1;
  params?: Params<ParamDefinition>;
  touchController!: TouchControllerApi;

  layout: Layout = new Layout();

  constructor(opts: IosControllerPluginOpts = defaultOpts) {
    this.controller = new Controller();
  }

  destroy = () => {
    this.controller.destroy();
  };

  extend(instance: Params<ParamDefinition>): void {
    this.params = instance;
    this.initController();
    this.initControllerApi();
  }

  persist = () => {
    if (!this.params) return;
    const data = {
      currentPageId: this.layout.currentPageId,
    };
    localStorage.setItem("ios-controller-plugin", JSON.stringify(data));
  };

  restore = () => {
    if (!this.params) return;
    const data = localStorage.getItem("ios-controller-plugin");
    if (!data) return;
    const parsed = JSON.parse(data);
    if (parsed.currentPageId) {
      this.layout.setCurrentPage(parsed.currentPageId);
    }
  };

  sendLayout = () => {
    const { controller, params } = this;
    if (!params) return;

    const pageDefs: { [key: string]: ControlSurface.WidgetDef } = {};

    for (const page of this.layout.pages) {
      const controlDefs: ControlSurface.WidgetDef[] = [];

      for (const controlId of page.controlIds) {
        const def = params.get(controlId) as BaseParam<any> | Params;
        if (!def) continue;
        if (def instanceof NumberParam) {
          controlDefs.push({
            id: def.name,
            typeName: "fader",
          });
        }
      }

      pageDefs[page.id] = {
        id: page.id,
        typeName: "col",
        children: controlDefs,
      };
    }

    const pageButtonDefs: ControlSurface.WidgetDef = {
      id: "pages",
      typeName: "row",
      weight: 0.2,
      children: this.layout.pages.map((p) => ({
        id: p.id,
        typeName: "btn",
        color: this.layout.currentPageId === p.id ? "#66aa33" : "#333333",
      })),
    };

    const currentPageDef = this.layout.currentPageId
      ? pageDefs[this.layout.currentPageId]
      : undefined;
    const layout: ControlSurface.LayoutDef = {
      root: {
        id: "root",
        typeName: "col",
        children: currentPageDef
          ? [currentPageDef, pageButtonDefs]
          : [pageButtonDefs],
      },
    };

    controller.rpcServer.request("setLayout", {
      layout,
      values: convertNumberValuesInObjToArrays(
        this.params!.valuesNormalized() as any
      ),
    });
  };

  initController = () => {
    const { controller, params } = this;

    params?.on("change", (evt) => {
      // This prevents infinite recursion
      if (evt.type !== "ios-controller-plugin") {
        controller.rpcServer.request("setValues", {
          values: convertNumberValuesInObjToArrays(
            this.params!.valuesNormalized() as any
          ),
        });
      }
    });

    controller.rpcServer.addMethod("valuesChanged", (data) => {
      console.log("[rpc]: valuesChanged", data);
      for (const [key, value] of Object.entries(data.values)) {
        const param = params!.get(key) as BaseParam<any>;
        if (param) {
          const val = Array.isArray(value) ? value[0] : value;
          if (param instanceof NumberParam) {
            // if (param.valueNormalized !== val) {
            param.setValueNormalized(val, "ios-controller-plugin");
            // }
          } else {
            if (param.value !== val)
              param.setValue(val, "ios-controller-plugin");
          }
        }
      }
    });
    controller.rpcServer.addMethod("iosConnectionStatusChanged", (values) => {
      console.log("[rpc]: iosConnectionStatusChanged", values);
    });
    controller.rpcServer.addMethod("layoutChanged", (values) => {
      console.log("[rpc]: layoutChanged", values);
    });
    controller.rpcServer.addMethod("buttonTap", (values) => {
      this.layout.setCurrentPage(values.buttonId);
      this.persist();
      this.sendLayout();
    });

    setTimeout(async () => {
      this.sendLayout();
    }, 200);
  };

  initControllerApi = () => {
    this.touchController = new TouchControllerApi(this.params!, this);
    this.params!.touchController = this.touchController;
  };

  clear = () => {
    this.layout.clear();
    this.sendLayout();
  };

  addPage = (def: LayoutPageInitArgs) => {
    this.layout.createPage(def);
    this.sendLayout();
  };

  addAll = () => {
    this.layout.clear();
    const page = this.layout.createPage({ id: "All Params" });

    const controlIds: string[] = [];
    for (const def of Object.values(this.params!.def)) {
      if (def instanceof NumberParam) {
        controlIds.push(def.name);
      }
    }

    page.controlIds = controlIds;

    this.layout.setCurrentPage(page.id);
    this.sendLayout();
  };
}

function convertNumberValuesInObjToArrays(obj: any) {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "number") {
      obj[key] = [value];
    } else if (typeof value === "object") {
      convertNumberValuesInObjToArrays(value);
    }
  }
  return obj;
}
