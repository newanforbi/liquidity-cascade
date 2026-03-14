import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import LiquidityCascade from "./LiquidityCascade.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LiquidityCascade />
  </StrictMode>
);
