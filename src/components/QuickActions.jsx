import React from 'react';

const QuickActions = ({ actions }) => (
	<div className='bg-white rounded-2xl shadow-lg p-6'>
		<h3 className='text-xl font-bold text-gray-800 mb-6'>Quick Actions</h3>
		<div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
			{actions.map((action, idx) => (
				<button
					key={idx}
					className='flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-200 hover:bg-gray-100 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1'>
					<div
						className={`w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3`}>
						<action.icon className='w-7 h-7 text-primary' />
					</div>
					<span className='text-base font-semibold text-gray-700'>
						{action.label}
					</span>
				</button>
			))}
		</div>
	</div>
);

export default QuickActions;
