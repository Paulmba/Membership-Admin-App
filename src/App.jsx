import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
// (Import other pages as needed)

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path='/' element={<Navigate to='/dashboard' replace />} />
				<Route path='/' element={<AdminLayout />}>
					<Route path='dashboard' element={<Dashboard />} />
					<Route path='members' element={<Members />} />
					{/* Add more routes */}
				</Route>
				<Route path='*' element={<div>404 Not Found</div>} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
