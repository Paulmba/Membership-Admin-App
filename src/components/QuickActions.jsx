import React from 'react';

const QuickActions = ({ actions }) => (
	<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
		<h3 className='text-lg font-semibold text-gray-900 mb-4'>Quick Actions</h3>
		<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
			{actions.map((action, idx) => (
				<button
					key={idx}
					className='flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors'>
					<div
						className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-2`}>
						<action.icon className='w-6 h-6 text-white' />
					</div>
					<span className='text-sm font-medium text-gray-900'>
						{action.label}
					</span>
				</button>
			))}
		</div>
	</div>
);

export default QuickActions;
