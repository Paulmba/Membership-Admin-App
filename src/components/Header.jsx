import React from 'react';

const Header = ({ activeTab }) => (
	<header className='bg-transparent'>
		<div className='px-6 py-8'>
			<h2 className='text-4xl font-bold text-gray-800 capitalize'>
				{activeTab}
			</h2>
		</div>
	</header>
);

export default Header;
