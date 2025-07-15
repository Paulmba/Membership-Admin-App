import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import ActivityItem from '../components/ActivityItem';
import EventCard from '../components/EventCard';
import QuickActions from '../components/QuickActions';
import {
	Users,
	Calendar,
	TrendingUp,
	UserCheck,
	Heart,
	Book,
	BarChart3,
	SmartphoneIcon,
	AlertCircle,
} from 'lucide-react';

const Dashboard = () => {
	const [dashboardData, setDashboardData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		fetchDashboardData();
	}, []);

	const fetchDashboardData = async () => {
		try {
			setLoading(true);

			const response = await fetch('http://localhost:8000/dashboard.php');

			const text = await response.text();
			console.log('Raw response:', text);

			const data = JSON.parse(text);
			console.log('Parsed dashboard data:', data);

			if (data.success) {
				setDashboardData(data.data);
				setError(null);
			} else {
				setError(data.message || 'Dashboard data fetch failed');
			}
		} catch (err) {
			console.error('Fetch error:', err);
			setError('Error connecting to server or invalid response');
		} finally {
			setLoading(false);
		}
	};

	const getIconComponent = (iconName) => {
		const icons = {
			UserCheck,
			Calendar,
			Heart,
			Book,
		};
		return icons[iconName] || UserCheck;
	};

	if (loading) {
		return (
			<div className='flex items-center justify-center h-64'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className='bg-red-50 border border-red-200 rounded-lg p-4'>
				<div className='flex items-center space-x-2'>
					<AlertCircle className='w-5 h-5 text-red-500' />
					<span className='text-red-700'>{error}</span>
				</div>
				<button
					onClick={fetchDashboardData}
					className='mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'>
					Retry
				</button>
			</div>
		);
	}

	const stats = [
		{
			title: 'Total Members',
			value: dashboardData?.stats?.total_members || 0,
			change: `+${dashboardData?.stats?.member_growth || 0}%`,
			icon: Users,
			color: 'bg-blue-500',
		},
		{
			title: 'Mobile App Users',
			value: dashboardData?.stats?.mobile_users || 0,
			change: `+${dashboardData?.stats?.mobile_growth || 0}%`,
			icon: SmartphoneIcon,
			color: 'bg-green-500',
		},
		{
			title: 'Attendance Rate',
			value: `${dashboardData?.stats?.attendance_rate || 0}%`,
			change: '+5%',
			icon: TrendingUp,
			color: 'bg-orange-500',
		},
	];

	const quickActions = [
		{ label: 'Add Member', icon: Users, color: 'bg-blue-500' },
		{ label: 'View Reports', icon: BarChart3, color: 'bg-orange-500' },
	];

	return (
		<>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
				{stats.map((stat, i) => (
					<StatCard key={i} stat={stat} />
				))}
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6'>
				<div className='lg:col-span-2'>
					<div className='bg-white rounded-xl shadow-sm border border-gray-200'>
						<div className='px-6 py-4 border-b border-gray-200'>
							<h3 className='text-lg font-semibold text-gray-900'>
								Recent Activities
							</h3>
						</div>
						<div className='p-2'>
							{dashboardData?.recent_activities?.length > 0 ? (
								dashboardData.recent_activities.map((activity, index) => (
									<ActivityItem
										key={index}
										activity={{
											...activity,
											icon: getIconComponent(activity.icon),
										}}
									/>
								))
							) : (
								<div className='p-4 text-center text-gray-500'>
									No recent activities
								</div>
							)}
						</div>
					</div>
				</div>

				<div>
					<div className='bg-white rounded-xl shadow-sm border border-gray-200'>
						<div className='px-6 py-4 border-b border-gray-200'>
							<div className='flex items-center justify-between'>
								<h3 className='text-lg font-semibold text-gray-900'>
									Upcoming Events
								</h3>
							</div>
						</div>
						<div className='p-4 space-y-4'>
							{dashboardData?.upcoming_events?.length > 0 ? (
								dashboardData.upcoming_events.map((event, index) => (
									<EventCard key={index} event={event} />
								))
							) : (
								<div className='text-center text-gray-500'>
									No upcoming events
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			<div className='mt-6'>
				<QuickActions actions={quickActions} />
			</div>
		</>
	);
};

export default Dashboard;
