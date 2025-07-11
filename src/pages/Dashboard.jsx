import React from 'react';
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
} from 'lucide-react';

const Dashboard = () => {
	const stats = [
		{
			title: 'Total Members',
			value: '1,247',
			change: '+12%',
			icon: Users,
			color: 'bg-blue-500',
		},
		{
			title: 'Events This Month',
			value: '18',
			change: '+3',
			icon: Calendar,
			color: 'bg-purple-500',
		},
		{
			title: 'Attendance Rate',
			value: '78%',
			change: '+5%',
			icon: TrendingUp,
			color: 'bg-orange-500',
		},
	];

	const recentActivities = [
		{
			type: 'member',
			title: 'New Member Registration',
			description: 'Sarah Johnson joined the congregation',
			time: '2 hours ago',
			icon: UserCheck,
		},
		{
			type: 'event',
			title: 'Youth Group Meeting',
			description: 'Wednesday evening service scheduled',
			time: '4 hours ago',
			icon: Calendar,
		},
		{
			type: 'donation',
			title: 'Donation Received',
			description: '$500 received from anonymous donor',
			time: '1 day ago',
			icon: Heart,
		},
		{
			type: 'prayer',
			title: 'Prayer Request',
			description: 'New prayer request submitted',
			time: '2 days ago',
			icon: Book,
		},
	];

	const upcomingEvents = [
		{
			title: 'Sunday Service',
			date: 'July 14, 2025',
			time: '10:00 AM',
			attendees: 120,
		},
		{
			title: 'Bible Study',
			date: 'July 16, 2025',
			time: '7:00 PM',
			attendees: 45,
		},
		{
			title: 'Youth Fellowship',
			date: 'July 18, 2025',
			time: '6:30 PM',
			attendees: 32,
		},
	];

	const quickActions = [
		{ label: 'Add Member', icon: Users, color: 'bg-blue-500' },
		{ label: 'View Reports', icon: BarChart3, color: 'bg-orange-500' },
	];

	return (
		<>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
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
							{recentActivities.map((activity, index) => (
								<ActivityItem key={index} activity={activity} />
							))}
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
							{upcomingEvents.map((event, index) => (
								<EventCard key={index} event={event} />
							))}
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
