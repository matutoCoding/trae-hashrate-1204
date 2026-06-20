import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import Dashboard from '@/pages/Dashboard';
import ApprovalList from '@/pages/ApprovalList';
import ApprovalNew from '@/pages/ApprovalNew';
import ApprovalDetail from '@/pages/ApprovalDetail';
import ReminderCenter from '@/pages/ReminderCenter';
import QueueBoard from '@/pages/QueueBoard';
import QueueManage from '@/pages/QueueManage';
import TakeNumber from '@/pages/TakeNumber';
import OvertimeHandle from '@/pages/OvertimeHandle';
import CompletionReview from '@/pages/CompletionReview';
import { useAutoReminder } from '@/hooks/useAutoReminder';

function AppInner() {
  useAutoReminder();

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/approval" element={<ApprovalList />} />
        <Route path="/approval/new" element={<ApprovalNew />} />
        <Route path="/approval/:id" element={<ApprovalDetail />} />
        <Route path="/reminder" element={<ReminderCenter />} />
        <Route path="/queue" element={<QueueBoard />} />
        <Route path="/queue/manage" element={<QueueManage />} />
        <Route path="/queue/take" element={<TakeNumber />} />
        <Route path="/overtime" element={<OvertimeHandle />} />
        <Route path="/completion-review" element={<CompletionReview />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppInner />
    </Router>
  );
}
