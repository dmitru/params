import type { Params } from "../../core";
import { IPlugin } from "../plugin";

import { ControlSurface, Controller } from "./ios-controller-client";

declare module "../../core" {
  interface Params {
    /** Here, you can extend the types of the core library */
  }
}

export type IosControllerPluginOpts = {
  /** An example option with a default */
  someOption: string;
};

const defaultOpts: IosControllerPluginOpts = {
  someOption: "some default value",
};

export class IosControllerPlugin implements IPlugin {
  controller: Controller;
  paramsPage = 1;
  params?: Params<any>;

  constructor(opts: IosControllerPluginOpts = defaultOpts) {
    this.controller = new Controller();
  }

  extend(instance: Params<any>): void {
    this.params = instance;
    this.initController();
  }

  sendLayout = () => {
    const { controller, params: instance } = this;

    const page1: ControlSurface.WidgetDef = {
      id: "params-page-1",
      typeName: "row",
      children: [
        {
          id: "p1",
          typeName: "fader",
        },
        {
          id: "p2",
          typeName: "fader",
        },
        {
          id: "p3",
          typeName: "fader",
        },
        {
          id: "blob.blur",
          typeName: "fader",
        },
      ],
    };

    const page2: ControlSurface.WidgetDef = {
      id: "params-page-2",
      typeName: "row",
      children: [
        {
          id: "color.r",
          typeName: "fader",
        },
        {
          id: "color.g",
          typeName: "fader",
        },
        {
          id: "color.b",
          typeName: "fader",
        },
      ],
    };

    const pageButtons: ControlSurface.WidgetDef = {
      id: "pages",
      typeName: "row",
      weight: 0.4,
      children: [
        {
          id: "page1",
          typeName: "btn",
        },
        {
          id: "page2",
          typeName: "btn",
        },
      ],
    };

    const layout: ControlSurface.LayoutDef = {
      root: {
        id: "root",
        typeName: "col",
        children: [this.paramsPage === 1 ? page1 : page2, pageButtons],
      },
    };

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

    controller.rpcServer.request("setLayout", {
      layout,
      values: convertNumberValuesInObjToArrays(this.params!.values() as any),
    });
  };

  initController = () => {
    const { controller, params } = this;

    params?.on("change", (key, newValue) => {
      console.log("change", key, newValue, params?.values());
      controller.rpcServer.request("setValues", {
        values: { [key]: [newValue] },
      });
    });

    controller.rpcServer.addMethod("valuesChanged", (data) => {
      console.log("[rpc]: valuesChanged", data);
      for (const [key, value] of Object.entries(data.values)) {
        const param = params!.get(key);
        console.log("param", param);
        if (param) {
          param.value = Array.isArray(value) ? value[0] : value;
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
      console.log("[rpc]: buttonTap", values);
      if (values.buttonId === "page1") {
        this.paramsPage = 1;
      }
      if (values.buttonId === "page2") {
        this.paramsPage = 2;
      }
      this.sendLayout();
    });

    setTimeout(async () => {
      this.sendLayout();
    }, 200);
  };
}
