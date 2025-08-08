import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import AIAnalytics from './pages/AIAnalytics';
import Announcements from './pages/Announcements';
import Leadership from './pages/Leadership';

function App() {
	return (
		<BrowserRouter>
			<Routes>
				{/* Redirect root to dashboard */}
				<Route path='/' element={<Navigate to='/dashboard' replace />} />

				{/* Main admin layout with nested routes */}
				<Route path='/' element={<AdminLayout />}>
					<Route path='dashboard' element={<Dashboard />} />
					<Route path='members' element={<Members />} />
					<Route path='announcements' element={<Announcements />} />
					<Route path='leadership' element={<Leadership />} />
					<Route path='reports' element={<AIAnalytics />} />
				</Route>

				{/* 404 fallback */}
				<Route path='*' element={<div>404 Not Found</div>} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
