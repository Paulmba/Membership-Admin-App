import React from 'react';

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

export default StatCard;
