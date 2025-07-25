import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const AdminLayout = () => {
	const [activeTab, setActiveTab] = useState('dashboard');

	return (
		<div className='flex h-screen bg-gray-50'>
			<Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
			<div className='flex-1 flex flex-col overflow-hidden'>
				<Header activeTab={activeTab} />
				<main className='flex-1 overflow-y-auto p-6'>
					<Outlet />
				</main>
			</div>
		</div>
	);
};

export default AdminLayout;
