import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './store/authContext';
import { ToastProvider } from './store/toastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import CallsPage from './pages/CallsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CampaignListPage from './pages/CampaignListPage';
import CreateCampaignPage from './pages/CreateCampaignPage';
import CampaignDetailsPage from './pages/CampaignDetailsPage';
import ScriptsPage from './pages/ScriptsPage';
import ScriptBuilderPage from './pages/ScriptBuilderPage';
import PaymentsPage from './pages/PaymentsPage';
import UsersPage from './pages/UsersPage';
import LandingRedirect from './pages/LandingRedirect';
import AdminOnlyRoute from './components/AdminOnlyRoute';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingRedirect />} />
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="calls" element={<CallsPage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="campaigns" element={<AdminOnlyRoute><CampaignListPage /></AdminOnlyRoute>} />
              <Route path="campaigns/new" element={<AdminOnlyRoute><CreateCampaignPage /></AdminOnlyRoute>} />
              <Route path="campaigns/:id" element={<AdminOnlyRoute><CampaignDetailsPage /></AdminOnlyRoute>} />
              <Route path="scripts" element={<AdminOnlyRoute><ScriptsPage /></AdminOnlyRoute>} />
              <Route path="scripts/new" element={<AdminOnlyRoute><ScriptBuilderPage /></AdminOnlyRoute>} />
              <Route path="scripts/:id" element={<AdminOnlyRoute><ScriptBuilderPage /></AdminOnlyRoute>} />
              <Route path="payments" element={<AdminOnlyRoute><PaymentsPage /></AdminOnlyRoute>} />
              <Route path="users" element={<AdminOnlyRoute><UsersPage /></AdminOnlyRoute>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
