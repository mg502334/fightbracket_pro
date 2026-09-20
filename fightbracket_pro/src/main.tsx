import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./app/App.tsx";
import { OAuthCallback } from "./app/components/OAuthCallback.tsx";
import { StaticPageRoute } from "./app/components/StaticPageRoute.tsx";
import { DisplayWindow } from "./app/components/DisplayWindow.tsx";
import "./styles/index.css";
import "./styles/theme.css";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="dark">
    <BrowserRouter>
      <Routes>
        <Route path="/display" element={<DisplayWindow />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/terms" element={<StaticPageRoute pageId="terms" />} />
        <Route path="/privacy" element={<StaticPageRoute pageId="privacy" />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </ThemeProvider>
);