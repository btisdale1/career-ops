import { Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PipelinePage from './pages/PipelinePage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import CvEditorPage from './pages/CvEditorPage.jsx';
import ScannerPage from './pages/ScannerPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import PortalsPage from './pages/PortalsPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="pipeline" element={<PipelinePage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="cv" element={<CvEditorPage />} />
        <Route path="scanner" element={<ScannerPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="portals" element={<PortalsPage />} />
      </Route>
    </Routes>
  );
}
