import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { createContentHubSaveHandler, readState } from "./contentHubBridge.js";

export default function createExternalRoot(rootElement, clientBuilder) {
  const root = createRoot(rootElement);

  return {
    render(props) {
      root.render(
        <React.StrictMode>
          <App
            initialState={readState(props?.entity, props?.config)}
            onSave={createContentHubSaveHandler(props)}
            clientBuilder={clientBuilder}
          />
        </React.StrictMode>
      );
    },
    unmount() {
      root.unmount();
    }
  };
}

if (typeof window !== "undefined") {
  window.createExternalRoot = createExternalRoot;
  window.WCDimensionsEditor = createExternalRoot;
}

if (typeof globalThis !== "undefined") {
  globalThis.createExternalRoot = globalThis.createExternalRoot || createExternalRoot;
  globalThis.WCDimensionsEditor = globalThis.WCDimensionsEditor || createExternalRoot;
}
