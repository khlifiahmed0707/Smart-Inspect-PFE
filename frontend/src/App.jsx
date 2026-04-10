import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import UserActionPage from './pages/UserActionPage';
import FaceAuthPage from './pages/FaceAuthPage';
import AdminFirstLoginPage from './pages/AdminFirstLoginPage';
import NormalAdminFaceAuthPage from './pages/NormalAdminFaceAuthPage';
import ProfilePage from './pages/ProfilePage';
import InspectionPage from './pages/InspectionPage';
import HistoryPage from './pages/HistoryPage';
import StatisticsPage from './pages/StatisticsPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AdminProfilePage from './pages/AdminProfilePage';
import RecoveryPage from './pages/RecoveryPage';
import MissionManagementPage from './pages/MissionManagementPage';
import MissionsPage from './pages/MissionsPage';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<UserManagementPage />} />
        <Route path="/admin/user-action" element={<UserActionPage />} />
        <Route path="/admin/missions" element={<MissionManagementPage />} />
        <Route path="/missions" element={<MissionsPage />} />

        {/* Auth Routes */}
        <Route path="/face-auth" element={<FaceAuthPage />} />
        <Route path="/admin-first-login" element={<AdminFirstLoginPage />} />
        <Route path="/face-auth-normal" element={<NormalAdminFaceAuthPage />} />

        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/inspection" element={<InspectionPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="/admin/profile" element={<AdminProfilePage />} />
        <Route path="/recovery" element={<RecoveryPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
