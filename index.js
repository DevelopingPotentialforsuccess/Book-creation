import React from "https://esm.sh/react@19";
import ReactDOM from "https://esm.sh/react-dom@19/client";
import App from "./App.js";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  React.createElement(
    React.StrictMode,
    null,
    React.createElement(App)
  )
);
