import {
  JSONRPCClient,
  JSONRPCServer,
  JSONRPCServerAndClient,
  TypedJSONRPCServerAndClient,
} from "json-rpc-2.0";

export class ControllerLayout {
  constructor() {}
}

export class Controller {
  rpcServer: TypedJSONRPCServerAndClient<
    WSApiRPC.ServerEvents,
    WSApiRPC.ServerMethods
  >;

  constructor() {
    let connectedClientSockets: WebSocket[] = [];
    const ws = new WebSocket("ws://localhost:7767");

    const rpcServer: TypedJSONRPCServerAndClient<
      WSApiRPC.ServerEvents,
      WSApiRPC.ServerMethods
    > = new JSONRPCServerAndClient(
      new JSONRPCServer(),
      new JSONRPCClient((request) => {
        // console.log(
        //   "[Controller]: Sending message to WebSocket server: ",
        //   request
        // );
        try {
          for (const sock of connectedClientSockets) {
            sock.send(JSON.stringify(request));
          }
          return Promise.resolve();
        } catch (error) {
          return Promise.reject(error);
        }
      })
    );

    this.rpcServer = rpcServer;

    // called when the connection is established with the WebSocket server
    ws.addEventListener("open", () => {
      connectedClientSockets.push(ws);
      console.log("[Controller]: Connected to WebSocket server");

      // ws.send('{"type":"get-values"}');
    });

    // called when a message is received from the WebSocket server
    ws.addEventListener("message", (evt) => {
      // console.log(
      //   "[Controller]: Received message from WebSocket server: ",
      //   evt.data
      // );
      rpcServer.receiveAndSend(JSON.parse(evt.data.toString()));
    });

    // called when the WebSocket connection is closed
    ws.addEventListener("close", () => {
      connectedClientSockets = [];
      console.log("[Controller]: Disconnected from WebSocket server");
    });
  }
}

// #region types

// type definition for  this JSON { body: { values: { 'xy-1': [0.5, 0.5] } }, typeName: 'values-changed' }

export namespace ControlSurface {
  export type Values = { [key: string]: number[] };

  export namespace MsgFrom {
    export type Any = ValuesChangedMsg | ButtonTapMsg;

    export type ValuesChangedMsg = {
      body: {
        values: Values;
      };
      typeName: "values-changed";
    };

    export type ButtonTapMsg = {
      body: {
        btnId: string;
      };
      typeName: "button-tap";
    };
  }

  export namespace MsgTo {
    export type Any = SetLayoutMsg | SetValuesMsg;

    export type SetLayoutMsg = {
      typeName: "set-layout";
      body: {
        /** Timestamp */
        t: number;
        root: WidgetDef;
        values: Values;
      };
    };
    export type SetValuesMsg = {
      typeName: "set-values";
      body: {
        /** Timestamp */
        t: number;
        values: Values;
      };
    };
  }

  export type LayoutDef = {
    root: WidgetDef;
  };

  export type WidgetDef =
    | {
        typeName: "xy";
        weight?: number;
        id: string;
        color?: string;
      }
    | {
        typeName: "fader";
        weight?: number;
        id: string;
        color?: string;
      }
    | {
        typeName: "btn";
        weight?: number;
        id: string;
        color?: string;
      }
    | {
        typeName: "col";
        weight?: number;
        id: string;
        children: WidgetDef[];
        color?: string;
      }
    | {
        typeName: "row";
        weight?: number;
        id: string;
        children: WidgetDef[];
        color?: string;
      };
}

/** Defines bi-directional protocol for communication between client and server */
namespace WSApiRPC {
  /** Client can call these methods on the server */
  export type ServerMethods = {
    isIOSConnected(): boolean;
    getValues(): ControlSurface.Values;
    getLayout(): ControlSurface.LayoutDef;
    setValues(params: { values: ControlSurface.Values }): void;
    setLayout(params: {
      layout: ControlSurface.LayoutDef;
      values: ControlSurface.Values;
    }): void;
  };

  /** Server-generated events: JSON RPC methods that the control server API can call on the connected clients */
  export type ServerEvents = {
    iosConnectionStatusChanged(params: { isConnected: boolean }): void;
    valuesChanged(params: { values: ControlSurface.Values }): void;
    buttonTap(params: { buttonId: string }): void;
    layoutChanged(params: {
      layout: ControlSurface.LayoutDef;
      values: ControlSurface.Values;
    }): void;
  };
}

// #endregion types
