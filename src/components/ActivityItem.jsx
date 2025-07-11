import React from 'react';

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

export default ActivityItem;
