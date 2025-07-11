import React from 'react';
import { Home, Users, BarChart3, LogOut } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => (
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

export default Sidebar;
