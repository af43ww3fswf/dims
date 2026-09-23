import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

const STORAGE_KEY = "wc-dimensions-demo";
let initialState;
try {
  initialState = JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? undefined;
} catch {
  initialState = undefined;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App
      initialState={initialState}
      onSave={async (state) => localStorage.setItem(STORAGE_KEY, JSON.stringify(state))}
    />
  </React.StrictMode>
);
