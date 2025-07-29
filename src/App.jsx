import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import AIAnalytics from './pages/AIAnalytics';
// (Import other pages as needed)

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path='/' element={<Navigate to='/dashboard' replace />} />
				<Route path='/' element={<AdminLayout />}>
					<Route path='dashboard' element={<Dashboard />} />
					<Route path='members' element={<Members />} />
					<Route path='reports' element={<AIAnalytics />} />

					{/* Add more routes */}
				</Route>
				<Route path='*' element={<div>404 Not Found</div>} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
