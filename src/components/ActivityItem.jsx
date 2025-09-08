import React from 'react';

const ActivityItem = ({ activity }) => (
	<div className='flex items-start space-x-4 p-4 hover:bg-gray-100 rounded-xl transition-colors duration-200'>
		<div className='w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center'>
			<activity.icon className='w-5 h-5 text-primary' />
		</div>
		<div className='flex-1'>
			<p className='text-base font-semibold text-gray-800'>{activity.title}</p>
			<p className='text-sm text-gray-600'>{activity.description}</p>
			<p className='text-xs text-gray-400 mt-1'>{activity.time}</p>
		</div>
	</div>
);

export default ActivityItem;
