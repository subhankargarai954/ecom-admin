import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./i18n";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <Suspense fallback={<div style={{ padding: 40 }}>Loading…</div>}>
        <App />
    </Suspense>
);
