import React, { useState } from 'react';
import {
	Users,
	Calendar,
	DollarSign,
	TrendingUp,
	Bell,
	Settings,
	ChevronDown,
	Search,
	Plus,
	Home,
	UserCheck,
	Book,
	Heart,
	BarChart3,
	FileText,
	CreditCard,
	Mail,
	Phone,
	MapPin,
	Clock,
	ChevronRight,
	LogOut,
} from 'lucide-react';

const Dashboard = () => {
	const [activeTab, setActiveTab] = useState('dashboard');

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

	const Sidebar = () => (
		<div className='w-64 bg-slate-900 text-white min-h-screen'>
			<div className='p-6'>
				<div className='flex items-center space-x-3'>
					<div className='w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center'>
						<Home className='w-5 h-5' />
					</div>
					<h1 className='text-xl font-bold'>ChurchAdmin</h1>
				</div>
			</div>

			<nav className='mt-6'>
				<div className='px-6 py-2'>
					<p className='text-xs font-semibold text-gray-400 uppercase tracking-wider'>
						Main
					</p>
				</div>

				{[
					{ id: 'dashboard', label: 'Dashboard', icon: Home },
					{ id: 'members', label: 'Members', icon: Users },
					{ id: 'reports', label: 'Reports', icon: BarChart3 },
					{ id: 'logout', label: 'Logout', icon: LogOut },
				].map((item) => (
					<button
						key={item.id}
						onClick={() => setActiveTab(item.id)}
						className={`w-full flex items-center space-x-3 px-6 py-3 text-left hover:bg-slate-800 transition-colors ${
							activeTab === item.id
								? 'bg-slate-800 border-r-2 border-blue-500'
								: ''
						}`}>
						<item.icon className='w-5 h-5' />
						<span>{item.label}</span>
					</button>
				))}
			</nav>
		</div>
	);

	const Header = () => (
		<header className='bg-white shadow-sm border-b border-gray-200'>
			<div className='flex items-center justify-between px-6 py-4'>
				<div className='flex items-center space-x-4'>
					<h2 className='text-2xl font-bold text-gray-900 capitalize'>
						{activeTab}
					</h2>
				</div>

				<div className='flex items-center space-x-4'>
					<div className='flex items-center space-x-2'>
						<div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center'>
							<span className='text-white text-sm font-medium'>JD</span>
						</div>
						<div className='hidden md:block'>
							<p className='text-sm font-medium text-gray-900'>John Doe</p>
							<p className='text-xs text-gray-500'>Administrator</p>
						</div>
						<ChevronDown className='w-4 h-4 text-gray-500' />
					</div>
				</div>
			</div>
		</header>
	);

	const StatCard = ({ stat }) => (
		<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
			<div className='flex items-center justify-between'>
				<div>
					<p className='text-sm font-medium text-gray-600'>{stat.title}</p>
					<p className='text-2xl font-bold text-gray-900 mt-1'>{stat.value}</p>
					<p className='text-sm text-green-600 mt-1'>
						{stat.change} from last month
					</p>
				</div>
				<div
					className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
					<stat.icon className='w-6 h-6 text-white' />
				</div>
			</div>
		</div>
	);

	const ActivityItem = ({ activity }) => (
		<div className='flex items-start space-x-3 p-4 hover:bg-gray-50 rounded-lg'>
			<div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
				<activity.icon className='w-4 h-4 text-blue-600' />
			</div>
			<div className='flex-1'>
				<p className='text-sm font-medium text-gray-900'>{activity.title}</p>
				<p className='text-sm text-gray-600'>{activity.description}</p>
				<p className='text-xs text-gray-500 mt-1'>{activity.time}</p>
			</div>
		</div>
	);

	const EventCard = ({ event }) => (
		<div className='bg-white rounded-lg border border-gray-200 p-4'>
			<div className='flex items-center justify-between'>
				<div>
					<h4 className='font-medium text-gray-900'>{event.title}</h4>
					<div className='flex items-center space-x-4 mt-2 text-sm text-gray-600'>
						<div className='flex items-center space-x-1'>
							<Calendar className='w-4 h-4' />
							<span>{event.date}</span>
						</div>
						<div className='flex items-center space-x-1'>
							<Clock className='w-4 h-4' />
							<span>{event.time}</span>
						</div>
					</div>
				</div>
				<div className='text-right'>
					<p className='text-sm font-medium text-gray-900'>{event.attendees}</p>
					<p className='text-xs text-gray-500'>attendees</p>
				</div>
			</div>
		</div>
	);

	return (
		<div className='flex h-screen bg-gray-50'>
			<Sidebar />

			<div className='flex-1 flex flex-col overflow-hidden'>
				<Header />

				<main className='flex-1 overflow-y-auto p-6'>
					{activeTab === 'dashboard' && (
						<div className='space-y-6'>
							{/* Stats Grid */}
							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
								{stats.map((stat, index) => (
									<StatCard key={index} stat={stat} />
								))}
							</div>

							{/* Main Content Grid */}
							<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
								{/* Recent Activities */}
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

								{/* Upcoming Events */}
								<div>
									<div className='bg-white rounded-xl shadow-sm border border-gray-200'>
										<div className='px-6 py-4 border-b border-gray-200'>
											<div className='flex items-center justify-between'>
												<h3 className='text-lg font-semibold text-gray-900'>
													Upcoming Events
												</h3>
												<button className='text-blue-600 hover:text-blue-700'>
													<Plus className='w-5 h-5' />
												</button>
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

							{/* Quick Actions */}
							<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
								<h3 className='text-lg font-semibold text-gray-900 mb-4'>
									Quick Actions
								</h3>
								<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
									{[
										{ label: 'Add Member', icon: Users, color: 'bg-blue-500' },
										{
											label: 'View Reports',
											icon: BarChart3,
											color: 'bg-orange-500',
										},
									].map((action, index) => (
										<button
											key={index}
											className='flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors'>
											<div
												className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-2`}>
												<action.icon className='w-6 h-6 text-white' />
											</div>
											<span className='text-sm font-medium text-gray-900'>
												{action.label}
											</span>
										</button>
									))}
								</div>
							</div>
						</div>
					)}

					{activeTab !== 'dashboard' && (
						<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-8'>
							<div className='text-center'>
								<h3 className='text-lg font-semibold text-gray-900 mb-2'>
									{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}{' '}
									Section
								</h3>
								<p className='text-gray-600'>
									This section would contain the {activeTab} management
									interface.
								</p>
							</div>
						</div>
					)}
				</main>
			</div>
		</div>
	);
};

export default Dashboard;
