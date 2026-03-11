import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useAuthStore } from "./store/authStore";
import PinPage from "./pages/PinPage";
import BoxesPage from "./pages/BoxesPage";

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
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-200 flex items-start justify-center">
        <div className="relative w-full max-w-sm md:max-w-md min-h-screen bg-background shadow-2xl overflow-hidden">
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
