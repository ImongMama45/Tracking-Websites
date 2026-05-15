import React from "react";
import ReactDOM from "react-dom/client";
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";

import AppLayout from "./ui/AppLayout.jsx";
import AuthLayout from "./ui/AuthLayout.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";
import WebsiteManagement from "./pages/WebsiteManagement.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import GuidePage from "./pages/GuidePage.jsx";
import { useAuthStore } from "./state/authStore.js";
import "./styles.css";

function Protected({ children }) {
  const access = useAuthStore((state) => state.access);
  return access ? children : <Navigate to="/login" replace />;
}

const basename = import.meta.env.VITE_BASE_PATH || "/";

const routes = [
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/forgot-password", element: <ForgotPassword /> }
    ]
  },
  {
    path: "/",
    element: (
      <Protected>
        <AppLayout />
      </Protected>
    ),
    children: [
      { index: true, element: <DashboardPage mode="overview" /> },
      { path: "realtime", element: <DashboardPage mode="realtime" /> },
      { path: "visitors", element: <AnalyticsPage type="visitors" /> },
      { path: "events", element: <AnalyticsPage type="events" /> },
      { path: "sessions", element: <AnalyticsPage type="sessions" /> },
      { path: "sources", element: <AnalyticsPage type="sources" /> },
      { path: "geography", element: <AnalyticsPage type="geography" /> },
      { path: "devices", element: <AnalyticsPage type="devices" /> },
      { path: "websites", element: <WebsiteManagement /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "guide", element: <GuidePage /> },
      { path: "settings", element: <SettingsPage /> },
    ]
  }
];

const router = createBrowserRouter(routes, { basename });

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
