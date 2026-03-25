import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useAuthStore } from "./store/authStore";
import PinPage from "./pages/PinPage";
import BoxesPage from "./pages/BoxesPage";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useEffect } from "react";

const queryClient = new QueryClient();

function AppRoutes() {
  const isLocked = useAuthStore((s) => s.isLocked);
  useAuthStore((s) => s.apiKey); // re-render trigger

  if (isLocked()) {
    return (
      <Routes>
        <Route path="*" element={<PinPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<BoxesPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: false });
      StatusBar.setBackgroundColor({ color: "#eff4f3" });
      StatusBar.setStyle({ style: Style.Light });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-200 flex items-start justify-center">
        <div className="relative w-full max-w-sm md:max-w-md bg-background shadow-2xl overflow-hidden" style={{ minHeight: "100dvh" }}>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
          <Toaster position="top-center" richColors />
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;
