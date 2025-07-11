import React from 'react';
import { Calendar, Clock } from 'lucide-react';

const EventCard = ({ event }) => (
	<div className='bg-white rounded-lg border border-gray-200 p-4'>
		<div className='flex items-center justify-between'>
			<div>
				<h4 className='font-medium text-gray-900'>{event.title}</h4>
				<div className='flex items-center space-x-4 mt-2 text-sm text-gray-600'>
					<div className='flex items-center space-x-1'>
						<Calendar className='w-4 h-4' />
						<span>{event.date}</span>
					</div>
					<div className='flex items-center space-x-1'>
						<Clock className='w-4 h-4' />
						<span>{event.time}</span>
					</div>
				</div>
			</div>
			<div className='text-right'>
				<p className='text-sm font-medium text-gray-900'>{event.attendees}</p>
				<p className='text-xs text-gray-500'>attendees</p>
			</div>
		</div>
	</div>
);

export default EventCard;
