import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import YandexMetrika from "./components/YandexMetrika.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
      <YandexMetrika />
    </BrowserRouter>
  </React.StrictMode>,
);
