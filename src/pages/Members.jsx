import React, { useState } from 'react';
import { Users, Plus, Eye } from 'lucide-react';

const Members = () => {
	const [activeTab, setActiveTab] = useState('all');
	const [searchTerm, setSearchTerm] = useState('');

	const members = [
		{ id: 1, name: 'Sarah Johnson', source: 'Mobile', joined: '2024-11-02' },
		{ id: 2, name: 'Michael Brown', source: 'Web', joined: '2023-09-15' },
		{ id: 3, name: 'Emily Davis', source: 'Mobile', joined: '2025-02-10' },
	];

	const filtered = members.filter(
		(m) =>
			(activeTab === 'all' || m.source === 'Mobile') &&
			m.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	return (
		<div className='space-y-6'>
			<div className='flex justify-between items-center'>
				<h3 className='text-xl font-semibold text-gray-900 flex items-center space-x-2'>
					<Users className='w-6 h-6' />
					<span>Members</span>
				</h3>
				<button className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'>
					<Plus className='w-4 h-4 mr-2' /> Add New Member
				</button>
			</div>

			<div className='flex items-center space-x-4'>
				{['all', 'mobile'].map((tabKey) => (
					<button
						key={tabKey}
						onClick={() => setActiveTab(tabKey)}
						className={`px-3 py-1 rounded-full font-medium ${
							activeTab === tabKey
								? 'bg-blue-500 text-white'
								: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
						} transition`}>
						{tabKey === 'all' ? 'All Members' : 'Mobile Users'}
					</button>
				))}

				<input
					type='text'
					placeholder='Search members...'
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className='ml-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:border-blue-300'
				/>
			</div>

			<div className='overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200'>
				<table className='min-w-full divide-y divide-gray-200'>
					<thead className='bg-gray-50'>
						<tr>
							<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
								Name
							</th>
							<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
								Source
							</th>
							<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
								Joined
							</th>
							<th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase'>
								Actions
							</th>
						</tr>
					</thead>
					<tbody className='divide-y divide-gray-100'>
						{filtered.map((member) => (
							<tr key={member.id} className='hover:bg-gray-50'>
								<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
									{member.name}
								</td>
								<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
									{member.source}
								</td>
								<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
									{member.joined}
								</td>
								<td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
									<button className='flex items-center text-blue-600 hover:text-blue-800'>
										<Eye className='w-4 h-4 mr-1' /> View
									</button>
								</td>
							</tr>
						))}
						{filtered.length === 0 && (
							<tr>
								<td colSpan='4' className='py-8 text-center text-gray-500'>
									No members found.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default Members;
