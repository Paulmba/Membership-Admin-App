import React from 'react';

const Header = ({ activeTab }) => (
	<header className='bg-white shadow-sm border-b border-gray-200'>
		<div className='flex items-center justify-between px-6 py-4'>
			<h2 className='text-2xl font-bold text-gray-900 capitalize'>
				{activeTab}
			</h2>
		</div>
	</header>
);

export default Header;
