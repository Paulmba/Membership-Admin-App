import React, { useState, createContext, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export const AnalyticsContext = createContext();

const ANALYTICS_API_URL = 'http://localhost:8000/api/ai_analytics.php';

const AdminLayout = () => {
	const [activeTab, setActiveTab] = useState('dashboard');
	const [analyticsState, setAnalyticsState] = useState({
		data: null,
		loading: false,
	});
	const [reportData, setReportData] = useState(null);
	const [customQueryData, setCustomQueryData] = useState(null);
	const [error, setError] = useState(null);

	const fetchAnalytics = useCallback(async () => {
		setAnalyticsState({ data: null, loading: true });
		setError(null);
		try {
			console.log('Attempting to fetch analytics from:', ANALYTICS_API_URL);
			const response = await fetch(ANALYTICS_API_URL);
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`HTTP error! status: ${response.status}, message: ${errorText}`
				);
			}
			const data = await response.json();
			if (data.success) {
				setAnalyticsState({ data: data.analytics, loading: false });
			} else {
				setError(data.message || 'Failed to fetch analytics from API');
				setAnalyticsState({ data: null, loading: false });
			}
		} catch (err) {
			setError(
				'Error fetching analytics. Please check your connection and API endpoint.'
			);
			setAnalyticsState({ data: null, loading: false });
			console.error('Analytics Fetch Error:', err);
		}
	}, []);

	const contextValue = {
		analyticsState,
		reportData,
		setReportData,
		customQueryData,
		setCustomQueryData,
		error,
		setError,
		fetchAnalytics,
	};

	return (
		<AnalyticsContext.Provider value={contextValue}>
			<div className='flex h-screen bg-background'>
				<Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
				<div className='flex-1 flex flex-col overflow-hidden'>
					<Header activeTab={activeTab} />
					<main className='flex-1 overflow-y-auto p-10'>
						<Outlet />
					</main>
				</div>
			</div>
		</AnalyticsContext.Provider>
	);
};

export default AdminLayout;