import React from 'react';
import { NavLink } from 'react-router-dom';
import {
	Home,
	Users,
	BarChart3,
	LogOut,
	Megaphone, // For Announcements
	UserCircle, // For Leadership
} from 'lucide-react';

const Sidebar = () => {
	const navItems = [
		{ to: '/dashboard', label: 'Dashboard', icon: Home },
		{ to: '/members', label: 'Members', icon: Users },
		{ to: '/announcements', label: 'Announcements', icon: Megaphone },
		{ to: '/leadership', label: 'Leadership', icon: UserCircle },
		{ to: '/reports', label: 'Reports', icon: BarChart3 },
		{ to: '/logout', label: 'Logout', icon: LogOut },
	];

	return (
		<div className='w-64 bg-sidebar text-sidebar-text min-h-screen flex flex-col'>
			<div className='p-6'>
				<div className='flex items-center space-x-3'>
					<div className='w-10 h-10 bg-primary rounded-lg flex items-center justify-center'>
						<Home className='w-6 h-6 text-white' />
					</div>
					<h1 className='text-2xl font-bold text-white'>ChurchAdmin</h1>
				</div>
			</div>

			<nav className='mt-8 flex-1'>
				<div className='px-6 py-2'>
					<p className='text-xs font-semibold text-gray-400 uppercase tracking-wider'>
						Main Menu
					</p>
				</div>

				{navItems.map((item) => (
					<NavLink
						key={item.to}
						to={item.to}
						className={({ isActive }) =>
							`w-full flex items-center space-x-4 px-6 py-3 text-left hover:bg-sidebar-active transition-colors duration-200 ${
								isActive ? 'bg-sidebar-active border-r-4 border-primary' : ''
							}`
						}>
						<item.icon className='w-6 h-6' />
						<span className="text-lg font-medium">{item.label}</span>
					</NavLink>
				))}
			</nav>
		</div>
	);
};

export default Sidebar;
