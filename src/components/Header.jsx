import React from 'react';
import { ChevronDown } from 'lucide-react';

const Header = ({ activeTab }) => (
	<header className='bg-white shadow-sm border-b border-gray-200'>
		<div className='flex items-center justify-between px-6 py-4'>
			<h2 className='text-2xl font-bold text-gray-900 capitalize'>
				{activeTab}
			</h2>
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

export default Header;
