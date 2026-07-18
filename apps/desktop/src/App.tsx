import { useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "@arco-design/web-react";
import { AppShell } from "./components/AppShell";
import { OverviewPage } from "./pages/OverviewPage";
import { WatchlistPage } from "./pages/WatchlistPage";
import { SymbolPage } from "./pages/SymbolPage";
import { SubscriptionPage } from "./pages/SubscriptionPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ChatPage } from "./pages/ChatPage";
import { initDesktopDataLayer } from "./setup";

function App() {
  useEffect(() => {
    initDesktopDataLayer();
  }, []);

  return (
    <ConfigProvider theme={{ primaryColor: "#3b82f6", borderRadius: 4 }}>
      <HashRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/symbol/:market/:code" element={<SymbolPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </HashRouter>
    </ConfigProvider>
  );
}

export default App;
