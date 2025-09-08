import React from 'react';

const StatCard = ({ stat }) => (
	<div className='bg-white rounded-2xl shadow-lg p-6 transition-transform transform hover:-translate-y-1'>
		<div className='flex items-center justify-between'>
			<div>
				<p className='text-base font-medium text-gray-500'>{stat.title}</p>
				<p className='text-4xl font-bold text-gray-800 mt-2'>{stat.value}</p>
				<p className='text-sm text-green-600 mt-2'>
					{stat.change} from last month
				</p>
			</div>
			<div
				className={`w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-md`}>
				<stat.icon className='w-8 h-8 text-white' />
			</div>
		</div>
	</div>
);

export default StatCard;
