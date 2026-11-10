import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { consumeOAuthReturn } from "@/lib/auth";
import { App } from "./App";
import "./index.css";

const ret = consumeOAuthReturn();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {ret.popup ? (
      <div className="grid h-full place-items-center text-sm text-muted">
        Signed in. You can close this window.
      </div>
    ) : (
      <App redirectToken={ret.token} />
    )}
  </StrictMode>,
);
