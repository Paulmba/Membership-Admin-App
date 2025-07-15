import React, { useState, useEffect } from 'react';
import {
	Users,
	Plus,
	Eye,
	Edit,
	Trash2,
	Search,
	Filter,
	AlertCircle,
	X,
} from 'lucide-react';

const Members = () => {
	const [activeTab, setActiveTab] = useState('all');
	const [searchTerm, setSearchTerm] = useState('');
	const [members, setMembers] = useState([]);
	const [filteredMembers, setFilteredMembers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [showAddModal, setShowAddModal] = useState(false);
	const [selectedMember, setSelectedMember] = useState(null);
	const [showViewModal, setShowViewModal] = useState(false);

	useEffect(() => {
		fetchMembers();
	}, []);

	useEffect(() => {
		filterMembers();
	}, [members, activeTab, searchTerm]);

	const fetchMembers = async (source = null, search = null) => {
		try {
			setLoading(true);
			let url = 'http://localhost:8000/members.php';
			const params = new URLSearchParams();

			if (source) params.append('source', source);
			if (search) params.append('search', search);

			if (params.toString()) {
				url += '?' + params.toString();
			}

			const response = await fetch(url);
			const data = await response.json();

			if (data.success) {
				setMembers(data.data);
				setError(null);
			} else {
				setError(data.message || 'Failed to fetch members');
			}
		} catch (err) {
			setError('Error connecting to server');
			console.error('Members fetch error:', err);
		} finally {
			setLoading(false);
		}
	};

	const filterMembers = () => {
		let filtered = members;

		// Filter by source
		if (activeTab === 'mobile') {
			filtered = filtered.filter((member) => member.source === 'Mobile');
		} else if (activeTab === 'web') {
			filtered = filtered.filter((member) => member.source === 'Web');
		}

		// Filter by search term
		if (searchTerm) {
			filtered = filtered.filter(
				(member) =>
					member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					member.phone_number?.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		setFilteredMembers(filtered);
	};

	const handleSearch = (e) => {
		setSearchTerm(e.target.value);
	};

	const handleTabChange = (tab) => {
		setActiveTab(tab);
	};

	const handleViewMember = async (memberId) => {
		try {
			const response = await fetch(
				`http://localhost:8000/members.php?id=${memberId}`
			);
			const data = await response.json();

			if (data.success) {
				setSelectedMember(data.data);
				setShowViewModal(true);
			} else {
				setError(data.message || 'Failed to fetch member details');
			}
		} catch (err) {
			setError('Error fetching member details');
			console.error('Member details fetch error:', err);
		}
	};

	const handleDeleteMember = async (memberId) => {
		if (!window.confirm('Are you sure you want to delete this member?')) {
			return;
		}

		try {
			const response = await fetch('http://localhost:8000/members.php', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ id: memberId }),
			});

			const data = await response.json();

			if (data.success) {
				setMembers(members.filter((m) => m.id !== memberId));
			} else {
				setError(data.message || 'Failed to delete member');
			}
		} catch (err) {
			setError('Error deleting member');
			console.error('Delete member error:', err);
		}
	};

	const handleAddMember = async (memberData) => {
		try {
			const response = await fetch('http://localhost:8000/members.php', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(memberData),
			});

			const data = await response.json();

			if (data.success) {
				fetchMembers(); // Refresh the list
				setShowAddModal(false);
			} else {
				setError(data.message || 'Failed to add member');
			}
		} catch (err) {
			setError('Error adding member');
			console.error('Add member error:', err);
		}
	};

	const getBadgeColor = (source) => {
		return source === 'Mobile'
			? 'bg-green-100 text-green-800'
			: 'bg-blue-100 text-blue-800';
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	if (loading) {
		return (
			<div className='flex items-center justify-center h-64'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{error && (
				<div className='bg-red-50 border border-red-200 rounded-lg p-4'>
					<div className='flex items-center space-x-2'>
						<AlertCircle className='w-5 h-5 text-red-500' />
						<span className='text-red-700'>{error}</span>
					</div>
					<button
						onClick={() => setError(null)}
						className='mt-2 text-red-600 hover:text-red-800'>
						Dismiss
					</button>
				</div>
			)}

			<div className='flex justify-between items-center'>
				<h3 className='text-xl font-semibold text-gray-900 flex items-center space-x-2'>
					<Users className='w-6 h-6' />
					<span>Members ({filteredMembers.length})</span>
				</h3>
				<button
					onClick={() => setShowAddModal(true)}
					className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'>
					<Plus className='w-4 h-4 mr-2' /> Add New Member
				</button>
			</div>

			<div className='flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4'>
				<div className='flex items-center space-x-2'>
					<Filter className='w-4 h-4 text-gray-500' />
					<div className='flex space-x-2'>
						{[
							{ key: 'all', label: 'All Members' },
							{ key: 'mobile', label: 'Mobile Users' },
							{ key: 'web', label: 'Web Users' },
						].map((tab) => (
							<button
								key={tab.key}
								onClick={() => handleTabChange(tab.key)}
								className={`px-3 py-1 rounded-full text-sm font-medium transition ${
									activeTab === tab.key
										? 'bg-blue-500 text-white'
										: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
								}`}>
								{tab.label}
							</button>
						))}
					</div>
				</div>

				<div className='flex-1 sm:max-w-md'>
					<div className='relative'>
						<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
						<input
							type='text'
							placeholder='Search members...'
							value={searchTerm}
							onChange={handleSearch}
							className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
						/>
					</div>
				</div>
			</div>

			<div className='overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200'>
				<table className='min-w-full divide-y divide-gray-200'>
					<thead className='bg-gray-50'>
						<tr>
							<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
								Member
							</th>
							<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
								Contact
							</th>
							<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
								Source
							</th>
							<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
								Joined
							</th>
							<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
								Status
							</th>
							<th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
								Actions
							</th>
						</tr>
					</thead>
					<tbody className='bg-white divide-y divide-gray-200'>
						{filteredMembers.length > 0 ? (
							filteredMembers.map((member) => (
								<tr key={member.id} className='hover:bg-gray-50'>
									<td className='px-6 py-4 whitespace-nowrap'>
										<div className='flex items-center'>
											<div className='flex-shrink-0 h-10 w-10'>
												<div className='h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center'>
													<span className='text-white font-medium'>
														{member.name
															.split(' ')
															.map((n) => n[0])
															.join('')
															.toUpperCase()}
													</span>
												</div>
											</div>
											<div className='ml-4'>
												<div className='text-sm font-medium text-gray-900'>
													{member.name}
												</div>
												<div className='text-sm text-gray-500'>
													{member.gender}
												</div>
											</div>
										</div>
									</td>
									<td className='px-6 py-4 whitespace-nowrap'>
										<div className='text-sm text-gray-900'>
											{member.phone_number || 'N/A'}
										</div>
										{member.mobile_phone && (
											<div className='text-sm text-gray-500'>
												{member.mobile_phone}
											</div>
										)}
									</td>
									<td className='px-6 py-4 whitespace-nowrap'>
										<span
											className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBadgeColor(
												member.source
											)}`}>
											{member.source}
										</span>
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
										{formatDate(member.joined)}
									</td>
									<td className='px-6 py-4 whitespace-nowrap'>
										<span
											className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
												member.is_verified
													? 'bg-green-100 text-green-800'
													: 'bg-yellow-100 text-yellow-800'
											}`}>
											{member.is_verified ? 'Verified' : 'Pending'}
										</span>
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
										<div className='flex justify-end space-x-2'>
											<button
												onClick={() => handleViewMember(member.id)}
												className='text-blue-600 hover:text-blue-800 p-1'
												title='View member'>
												<Eye className='w-4 h-4' />
											</button>
											<button
												onClick={() => handleDeleteMember(member.id)}
												className='text-red-600 hover:text-red-800 p-1'
												title='Delete member'>
												<Trash2 className='w-4 h-4' />
											</button>
										</div>
									</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan='6' className='py-8 text-center text-gray-500'>
									{searchTerm
										? 'No members found matching your search.'
										: 'No members found.'}
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{/* Add Member Modal */}
			{showAddModal && (
				<AddMemberModal
					onClose={() => setShowAddModal(false)}
					onSubmit={handleAddMember}
				/>
			)}

			{/* View Member Modal */}
			{showViewModal && selectedMember && (
				<ViewMemberModal
					member={selectedMember}
					onClose={() => {
						setShowViewModal(false);
						setSelectedMember(null);
					}}
				/>
			)}
		</div>
	);
};

// Add Member Modal Component
const AddMemberModal = ({ onClose, onSubmit }) => {
	const [formData, setFormData] = useState({
		first_name: '',
		last_name: '',
		gender: '',
		dob: '',
		address: '',
		phone_number: '',
		profile_completed: 0,
	});

	const handleSubmit = (e) => {
		e.preventDefault();
		onSubmit(formData);
	};

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	return (
		<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
			<div className='bg-white rounded-lg max-w-md w-full p-6'>
				<div className='flex justify-between items-center mb-4'>
					<h3 className='text-lg font-semibold'>Add New Member</h3>
					<button
						onClick={onClose}
						className='text-gray-500 hover:text-gray-700'>
						<X className='w-5 h-5' />
					</button>
				</div>

				<form onSubmit={handleSubmit} className='space-y-4'>
					<div className='grid grid-cols-2 gap-4'>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								First Name *
							</label>
							<input
								type='text'
								name='first_name'
								value={formData.first_name}
								onChange={handleChange}
								required
								className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
							/>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								Last Name *
							</label>
							<input
								type='text'
								name='last_name'
								value={formData.last_name}
								onChange={handleChange}
								required
								className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
							/>
						</div>
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>
							Gender *
						</label>
						<select
							name='gender'
							value={formData.gender}
							onChange={handleChange}
							required
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'>
							<option value=''>Select Gender</option>
							<option value='Male'>Male</option>
							<option value='Female'>Female</option>
						</select>
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>
							Date of Birth *
						</label>
						<input
							type='date'
							name='dob'
							value={formData.dob}
							onChange={handleChange}
							required
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
						/>
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>
							Phone Number
						</label>
						<input
							type='tel'
							name='phone_number'
							value={formData.phone_number}
							onChange={handleChange}
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
						/>
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>
							Address
						</label>
						<textarea
							name='address'
							value={formData.address}
							onChange={handleChange}
							rows='3'
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
						/>
					</div>

					<div className='flex justify-end space-x-3 pt-4'>
						<button
							type='button'
							onClick={onClose}
							className='px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50'>
							Cancel
						</button>
						<button
							type='submit'
							className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'>
							Add Member
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

// View Member Modal Component
const ViewMemberModal = ({ member, onClose }) => {
	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	return (
		<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
			<div className='bg-white rounded-lg max-w-lg w-full p-6'>
				<div className='flex justify-between items-center mb-4'>
					<h3 className='text-lg font-semibold'>Member Details</h3>
					<button
						onClick={onClose}
						className='text-gray-500 hover:text-gray-700'>
						<X className='w-5 h-5' />
					</button>
				</div>

				<div className='space-y-4'>
					<div className='flex items-center space-x-4'>
						<div className='flex-shrink-0 h-16 w-16'>
							<div className='h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center'>
								<span className='text-white font-medium text-xl'>
									{member.name
										.split(' ')
										.map((n) => n[0])
										.join('')
										.toUpperCase()}
								</span>
							</div>
						</div>
						<div>
							<h4 className='text-xl font-semibold text-gray-900'>
								{member.name}
							</h4>
							<p className='text-gray-600'>{member.gender}</p>
							<span
								className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
									member.source === 'Mobile'
										? 'bg-green-100 text-green-800'
										: 'bg-blue-100 text-blue-800'
								}`}>
								{member.source}
							</span>
						</div>
					</div>

					<div className='grid grid-cols-2 gap-4'>
						<div>
							<label className='block text-sm font-medium text-gray-700'>
								Date of Birth
							</label>
							<p className='text-sm text-gray-900'>{formatDate(member.dob)}</p>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700'>
								Joined
							</label>
							<p className='text-sm text-gray-900'>
								{formatDate(member.joined)}
							</p>
						</div>
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700'>
							Phone Number
						</label>
						<p className='text-sm text-gray-900'>
							{member.phone_number || 'N/A'}
						</p>
					</div>

					{member.mobile_phone && (
						<div>
							<label className='block text-sm font-medium text-gray-700'>
								Mobile Phone
							</label>
							<p className='text-sm text-gray-900'>{member.mobile_phone}</p>
						</div>
					)}

					<div>
						<label className='block text-sm font-medium text-gray-700'>
							Address
						</label>
						<p className='text-sm text-gray-900'>{member.address || 'N/A'}</p>
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700'>
							Profile Status
						</label>
						<p className='text-sm text-gray-900'>
							{member.profile_completed ? 'Completed' : 'Incomplete'}
						</p>
					</div>

					{member.is_verified !== null && (
						<div>
							<label className='block text-sm font-medium text-gray-700'>
								Verification Status
							</label>
							<span
								className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
									member.is_verified
										? 'bg-green-100 text-green-800'
										: 'bg-yellow-100 text-yellow-800'
								}`}>
								{member.is_verified ? 'Verified' : 'Pending'}
							</span>
						</div>
					)}
				</div>

				<div className='flex justify-end pt-6'>
					<button
						onClick={onClose}
						className='px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700'>
						Close
					</button>
				</div>
			</div>
		</div>
	);
};

export default Members;
