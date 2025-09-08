import React from 'react';
import { Calendar, Clock } from 'lucide-react';

const EventCard = ({ event }) => (
	<div className='bg-white rounded-2xl shadow-lg p-6 transition-transform transform hover:-translate-y-1'>
		<div className='flex items-center justify-between'>
			<div>
				<h4 className='font-bold text-lg text-gray-800'>{event.title}</h4>
				<div className='flex items-center space-x-6 mt-3 text-sm text-gray-500'>
					<div className='flex items-center space-x-2'>
						<Calendar className='w-5 h-5 text-primary' />
						<span className="font-medium">{event.date}</span>
					</div>
					<div className='flex items-center space-x-2'>
						<Clock className='w-5 h-5 text-primary' />
						<span className="font-medium">{event.time}</span>
					</div>
				</div>
			</div>
			<div className='text-right'>
				<p className='text-2xl font-bold text-primary'>{event.attendees}</p>
				<p className='text-sm text-gray-500'>attendees</p>
			</div>
		</div>
	</div>
);

export default EventCard;
