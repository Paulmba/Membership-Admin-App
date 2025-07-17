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
	Monitor,
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
			setError(null);

			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000);

			const response = await fetch('http://localhost:8000/api/dashboard.php', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!response.ok)
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);

			const contentType = response.headers.get('content-type') || '';
			if (!contentType.includes('application/json')) {
				const text = await response.text();
				throw new Error(
					'Server returned non-JSON response: ' + text.slice(0, 100)
				);
			}

			const data = await response.json();
			if (data.success) {
				setDashboardData(data.data);
			} else {
				throw new Error(data.message || 'Dashboard data fetch failed');
			}
		} catch (err) {
			if (err.name === 'AbortError') {
				setError('Request timed out - server may be down');
			} else if (err.message.includes('Failed to fetch')) {
				setError(
					'Cannot connect to server. Ensure PHP server is running on port 8000'
				);
			} else {
				setError(err.message);
			}
		} finally {
			setLoading(false);
		}
	};

	const formatGrowth = (value) => {
		if (value == null) return '';
		return value >= 0 ? `+${value}%` : `${value}%`;
	};

	const getIcon = (iconName) => {
		const icons = { UserCheck, Calendar, Heart, Book };
		return icons[iconName] || UserCheck;
	};

	if (loading)
		return (
			<div className='flex items-center justify-center h-64'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
				<span className='ml-3 text-gray-600'>Loading dashboard...</span>
			</div>
		);

	if (error && !dashboardData)
		return (
			<div className='bg-red-50 border border-red-200 rounded-lg p-6'>
				<div className='flex items-center space-x-2 mb-4'>
					<AlertCircle className='w-5 h-5 text-red-500' />
					<h3 className='text-lg font-semibold text-red-700'>
						Connection Error
					</h3>
				</div>
				<p className='text-red-700 mb-4'>{error}</p>
				<button
					onClick={fetchDashboardData}
					className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'>
					Retry Connection
				</button>
			</div>
		);

	const { stats, recent_activities, upcoming_events } = dashboardData;
	const webUsers = (stats.total_members || 0) - (stats.mobile_users || 0);

	const statItems = [
		{
			title: 'Total Members',
			value: stats.total_members,
			change: formatGrowth(stats.member_growth),
			icon: Users,
			color: 'bg-blue-500',
		},
		{
			title: 'Mobile Users',
			value: stats.mobile_users,
			change: formatGrowth(stats.mobile_growth),
			icon: SmartphoneIcon,
			color: 'bg-green-500',
		},
		{
			title: 'Web Users',
			value: webUsers,
			change: '',
			icon: Monitor,
			color: 'bg-purple-500',
		},
		{
			title: 'Attendance Rate',
			value: `${stats.attendance_rate}%`,
			change: '',
			icon: TrendingUp,
			color: 'bg-orange-500',
		},
	];

	const quickActions = [
		{ label: 'Add Member', icon: Users, color: 'bg-blue-500' },
		{ label: 'View Reports', icon: BarChart3, color: 'bg-orange-500' },
		{ label: 'Schedule Event', icon: Calendar, color: 'bg-green-500' },
	];

	return (
		<>
			{error && (
				<div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4'>
					<AlertCircle className='w-4 h-4 text-yellow-600' />
					<span className='text-yellow-700 text-sm ml-2'>
						Dashboard loaded with issues: {error}
					</span>
				</div>
			)}

			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
				{statItems.map((stat, idx) => (
					<StatCard key={idx} stat={stat} />
				))}
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6'>
				<div className='lg:col-span-2 bg-white rounded-xl shadow border border-gray-200'>
					<div className='px-6 py-4 border-b border-gray-200'>
						<h3 className='text-lg font-semibold text-gray-900'>
							Recent Activities
						</h3>
					</div>
					<div className='p-2'>
						{recent_activities.length > 0 ? (
							recent_activities.map((act, i) => (
								<ActivityItem
									key={i}
									activity={{ ...act, icon: getIcon(act.icon) }}
								/>
							))
						) : (
							<div className='p-4 text-center text-gray-500'>
								No recent activities
							</div>
						)}
					</div>
				</div>

				<div className='bg-white rounded-xl shadow border border-gray-200'>
					<div className='px-6 py-4 border-b border-gray-200 flex items-center justify-between'>
						<h3 className='text-lg font-semibold text-gray-900'>
							Upcoming Events
						</h3>
						<Calendar className='w-5 h-5 text-gray-400' />
					</div>
					<div className='p-4 space-y-4'>
						{upcoming_events.length > 0 ? (
							upcoming_events.map((evt, i) => <EventCard key={i} event={evt} />)
						) : (
							<div className='text-center text-gray-500'>
								No upcoming events
							</div>
						)}
					</div>
				</div>
			</div>

			<div className='mt-6'>
				<QuickActions actions={quickActions} />
			</div>

			<div className='mt-6 grid grid-cols-1 md:grid-cols-2 gap-6'>
				<div className='bg-white rounded-xl shadow border border-gray-200 p-6'>
					<h3 className='text-lg font-semibold text-gray-900 mb-4'>
						Member Registration Sources
					</h3>
					<div className='space-y-4'>
						<div className='flex items-center justify-between'>
							<div className='flex items-center space-x-2'>
								<span className='w-3 h-3 bg-green-500 rounded-full'></span>
								<span className='text-sm font-medium text-gray-700'>
									Mobile
								</span>
							</div>
							<div className='text-right'>
								<div className='text-sm font-semibold text-gray-900'>
									{stats.mobile_users}
								</div>
								<div className='text-xs text-gray-500'>
									{stats.total_members > 0
										? Math.round(
												(stats.mobile_users / stats.total_members) * 100
										  )
										: 0}
									%
								</div>
							</div>
						</div>
						<div className='flex items-center justify-between'>
							<div className='flex items-center space-x-2'>
								<span className='w-3 h-3 bg-purple-500 rounded-full'></span>
								<span className='text-sm font-medium text-gray-700'>Web</span>
							</div>
							<div className='text-right'>
								<div className='text-sm font-semibold text-gray-900'>
									{webUsers}
								</div>
								<div className='text-xs text-gray-500'>
									{stats.total_members > 0
										? Math.round((webUsers / stats.total_members) * 100)
										: 0}
									%
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className='bg-white rounded-xl shadow border border-gray-200 p-6'>
					<h3 className='text-lg font-semibold text-gray-900 mb-4'>
						Growth Summary (Last Month)
					</h3>
					<div className='space-y-4'>
						<div className='flex items-center justify-between'>
							<span className='text-sm font-medium text-gray-700'>
								Member Growth
							</span>
							<span
								className={`${
									parseFloat(stats.member_growth) >= 0
										? 'text-green-600'
										: 'text-red-600'
								} text-sm font-semibold`}>
								{' '}
								{formatGrowth(stats.member_growth)}
							</span>
						</div>
						<div className='flex items-center justify-between'>
							<span className='text-sm font-medium text-gray-700'>
								Mobile Growth
							</span>
							<span
								className={`${
									parseFloat(stats.mobile_growth) >= 0
										? 'text-green-600'
										: 'text-red-600'
								} text-sm font-semibold`}>
								{' '}
								{formatGrowth(stats.mobile_growth)}
							</span>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default Dashboard;
