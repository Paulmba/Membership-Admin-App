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
	Upload,
} from 'lucide-react';

const Members = () => {
	const [activeTab, setActiveTab] = useState('all');
	const [searchTerm, setSearchTerm] = useState('');
	const [members, setMembers] = useState([]);
	const [filteredMembers, setFilteredMembers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [showAddModal, setShowAddModal] = useState(false);
	const [showDetailPage, setShowDetailPage] = useState(false);
	const [detailMember, setDetailMember] = useState(null);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editingMember, setEditingMember] = useState(null);
	const [showBulkImportModal, setShowBulkImportModal] = useState(false);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [totalMembers, setTotalMembers] = useState(0);

	useEffect(() => {
		fetchMembers(null, null, page);
	}, [page]);

	useEffect(() => {
		filterMembers();
	}, [members, activeTab, searchTerm]);

	const fetchMembers = async (source = null, search = null, page = 1) => {
		try {
			setLoading(true);
			let url = `http://localhost:8000/api/members.php?page=${page}&limit=10`;
			const params = new URLSearchParams();

			if (source) params.append('source', source);
			if (search) params.append('search', search);

			if (params.toString()) {
				url += '&' + params.toString();
			}

			const response = await fetch(url);
			const data = await response.json();

			if (data.success) {
				setMembers(prevMembers => page === 1 ? data.data : [...prevMembers, ...data.data]);
				setTotalMembers(data.total);
				setHasMore(data.data.length > 0);
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
				`http://localhost:8000/api/members.php?id=${memberId}`
			);
			const data = await response.json();

			if (data.success) {
				setDetailMember(data.data);
				setShowDetailPage(true);
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
			const response = await fetch('http://localhost:8000/api/members.php', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ id: memberId }),
			});

			const data = await response.json();

			if (data.success) {
				// Remove the member from the state
				setMembers(members.filter((m) => m.id !== memberId));
				setError(null);
				// Show success message temporarily
				const successMessage = 'Member deleted successfully';
				setError(null);
				// You could add a success state if needed
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
			// Add source field to member data (defaulting to Web for manually added members)
			const memberWithSource = {
				...memberData,
				source: 'Web', // You can change this or add it to the form
			};

			const response = await fetch('http://localhost:8000/api/members.php', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(memberWithSource),
			});

			const data = await response.json();

			if (data.success) {
				// Refresh the members list
				await fetchMembers();
				setShowAddModal(false);
				setError(null);
				// You could add a success message here
			} else {
				setError(data.message || 'Failed to add member');
			}
		} catch (err) {
			setError('Error adding member');
			console.error('Add member error:', err);
		}
	};
	const handleBulkImport = (importedMembers) => {
		setMembers((prev) => [...prev, ...importedMembers]);
		setError(null);
	};

	const handleEditMember = async (memberData) => {
		try {
			const response = await fetch('http://localhost:8000/api/members.php', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ ...memberData, id: editingMember.id }),
			});

			const data = await response.json();

			if (data.success) {
				// Update the detailMember state with new data
				setDetailMember({ ...detailMember, ...memberData });
				// Update the members list
				setMembers(
					members.map((m) =>
						m.id === editingMember.id ? { ...m, ...memberData } : m
					)
				);
				setShowEditModal(false);
				setEditingMember(null);
				setError(null);
			} else {
				setError(data.message || 'Failed to update member');
			}
		} catch (err) {
			setError('Error updating member');
			console.error('Update member error:', err);
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

	// Add this new condition BEFORE the existing return
	if (showDetailPage && detailMember) {
		return (
			<>
				<MemberDetailPage
					member={detailMember}
					onBack={() => {
						setShowDetailPage(false);
						setDetailMember(null);
					}}
					onEdit={(member) => {
						setEditingMember(member);
						setShowEditModal(true);
					}}
				/>
				{/* Add the Edit Modal here so it shows even when on detail page */}
				{showEditModal && editingMember && (
					<EditMemberModal
						member={editingMember}
						onClose={() => {
							setShowEditModal(false);
							setEditingMember(null);
						}}
						onSubmit={handleEditMember}
					/>
				)}
			</>
		);
	}

	// Keep your existing return statement exactly as it is
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
					<span>Members ({totalMembers})</span>
				</h3>
				<div className="flex space-x-2">
					<button
						onClick={() => setShowAddModal(true)}
						className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'>
						<Plus className='w-4 h-4 mr-2' /> Add New Member
					</button>
					<button
						onClick={() => setShowBulkImportModal(true)}
						className='flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'>
						<Upload className='w-4 h-4 mr-2' /> Bulk Import from CSV
					</button>
				</div>
			</div>

			

			<div className='flex justify-between items-center'>
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

				<div className='flex items-center space-x-2'>
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
					{hasMore && (
						<button
							onClick={() => setPage(prevPage => prevPage + 1)}
							disabled={loading}
							className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'>
							{loading ? 'Loading...' : 'Load More'}
						</button>
					)}
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
			{/* Bulk Import Modal */}
			{showBulkImportModal && (
				<BulkImportModal
					onClose={() => setShowBulkImportModal(false)}
					onImport={handleBulkImport}
				/>
			)}
			{/* Edit Member Modal - ADD THIS */}
			{showEditModal && editingMember && (
				<EditMemberModal
					member={editingMember}
					onClose={() => {
						setShowEditModal(false);
						setEditingMember(null);
					}}
					onSubmit={handleEditMember}
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

	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			await onSubmit(formData);
		} catch (error) {
			console.error('Error submitting form:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		setFormData({
			...formData,
			[name]: type === 'checkbox' ? (checked ? 1 : 0) : value,
		});
	};

	return (
		<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
			<div className='bg-white rounded-lg max-w-md w-full p-6'>
				<div className='flex justify-between items-center mb-4'>
					<h3 className='text-lg font-semibold'>Add New Member</h3>
					<button
						onClick={onClose}
						className='text-gray-500 hover:text-gray-700'
						disabled={isSubmitting}>
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
								disabled={isSubmitting}
								className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
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
								disabled={isSubmitting}
								className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
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
							disabled={isSubmitting}
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'>
							<option value=''>Select Gender</option>
							<option value='Male'>Male</option>
							<option value='Female'>Female</option>
							<option value='Other'>Other</option>
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
							disabled={isSubmitting}
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
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
							disabled={isSubmitting}
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
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
							disabled={isSubmitting}
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
						/>
					</div>

					<div className='flex items-center'>
						<input
							type='checkbox'
							name='profile_completed'
							checked={formData.profile_completed === 1}
							onChange={handleChange}
							disabled={isSubmitting}
							className='mr-2'
						/>
						<label className='text-sm font-medium text-gray-700'>
							Profile Completed
						</label>
					</div>

					<div className='flex justify-end space-x-3 pt-4'>
						<button
							type='button'
							onClick={onClose}
							disabled={isSubmitting}
							className='px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50'>
							Cancel
						</button>
						<button
							type='submit'
							disabled={isSubmitting}
							className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center'>
							{isSubmitting ? (
								<>
									<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
									Adding...
								</>
							) : (
								'Add Member'
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
// Add the BulkImportModal component
const BulkImportModal = ({ onClose, onImport }) => {
	const [file, setFile] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState(null);

	const handleFileChange = (e) => {
		const selectedFile = e.target.files[0];
		if (selectedFile && selectedFile.type === 'text/csv') {
			setFile(selectedFile);
			setError(null);
		} else {
			setError('Please select a valid CSV file');
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!file) {
			setError('Please select a CSV file');
			return;
		}

		setIsSubmitting(true);
		console.log("Submitting file:", file);
		try {
			const formData = new FormData();
			formData.append('csvFile', file);

			console.log("Sending request to bulk-import.php");
			const response = await fetch(
				'http://localhost:8000/api/bulk-import.php',
				{
					method: 'POST',
					body: formData,
				}
			);

			console.log("Received response from bulk-import.php:", response);
			const data = await response.json();
			console.log("Parsed response data:", data);

			if (data.success) {
				onImport(data.data);
				onClose();
			} else {
				setError(data.message || 'Failed to import members');
			}
		} catch (err) {
			setError('Error importing members');
			console.error('Bulk import error:', err);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
			<div className='bg-white rounded-lg max-w-md w-full p-6'>
				<div className='flex justify-between items-center mb-4'>
					<h3 className='text-lg font-semibold'>Bulk Import Members</h3>
					<button
						onClick={onClose}
						className='text-gray-500 hover:text-gray-700'
						disabled={isSubmitting}>
						<X className='w-5 h-5' />
					</button>
				</div>

				<form onSubmit={handleSubmit} className='space-y-4'>
					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>
							CSV File *
						</label>
						<input
							type='file'
							accept='.csv'
							onChange={handleFileChange}
							required
							disabled={isSubmitting}
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
						/>
						<p className='text-xs text-gray-500 mt-1'>
							CSV format should include: first_name, last_name, gender, dob,
							address, phone_number
						</p>
					</div>

					{error && (
						<div className='bg-red-50 border border-red-200 rounded-lg p-3'>
							<div className='flex items-center space-x-2'>
								<AlertCircle className='w-4 h-4 text-red-500' />
								<span className='text-red-700 text-sm'>{error}</span>
							</div>
						</div>
					)}

					<div className='flex justify-end space-x-3 pt-4'>
						<button
							type='button'
							onClick={onClose}
							disabled={isSubmitting}
							className='px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50'>
							Cancel
						</button>
						<button
							type='submit'
							disabled={isSubmitting || !file}
							className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center'>
							{isSubmitting ? (
								<>
									<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
									Importing...
								</>
							) : (
								'Import Members'
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

// Edit Member Modal Component
const EditMemberModal = ({ member, onClose, onSubmit }) => {
	const [formData, setFormData] = useState({
		first_name: member.first_name || member.name?.split(' ')[0] || '',
		last_name: member.last_name || member.name?.split(' ')[1] || '',
		gender: member.gender || '',
		dob: member.dob || '',
		address: member.address || '',
		phone_number: member.phone_number || '',
		profile_completed: member.profile_completed || 0,
	});

	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			await onSubmit(formData);
		} catch (error) {
			console.error('Error submitting form:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		setFormData({
			...formData,
			[name]: type === 'checkbox' ? (checked ? 1 : 0) : value,
		});
	};

	return (
		<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
			<div className='bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto'>
				<div className='flex justify-between items-center mb-4'>
					<h3 className='text-lg font-semibold'>Edit Member</h3>
					<button
						onClick={onClose}
						className='text-gray-500 hover:text-gray-700'
						disabled={isSubmitting}>
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
								disabled={isSubmitting}
								className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
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
								disabled={isSubmitting}
								className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
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
							disabled={isSubmitting}
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'>
							<option value=''>Select Gender</option>
							<option value='Male'>Male</option>
							<option value='Female'>Female</option>
							<option value='Other'>Other</option>
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
							disabled={isSubmitting}
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
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
							disabled={isSubmitting}
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
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
							disabled={isSubmitting}
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
						/>
					</div>

					<div className='flex items-center'>
						<input
							type='checkbox'
							name='profile_completed'
							checked={formData.profile_completed === 1}
							onChange={handleChange}
							disabled={isSubmitting}
							className='mr-2'
						/>
						<label className='text-sm font-medium text-gray-700'>
							Profile Completed
						</label>
					</div>

					<div className='flex justify-end space-x-3 pt-4'>
						<button
							type='button'
							onClick={onClose}
							disabled={isSubmitting}
							className='px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50'>
							Cancel
						</button>
						<button
							type='submit'
							disabled={isSubmitting}
							className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center'>
							{isSubmitting ? (
								<>
									<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
									Updating...
								</>
							) : (
								'Update Member'
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

// View Member Modal Component
// Member Detail Page Component
const MemberDetailPage = ({ member, onBack, onEdit }) => {
	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	const formatAddress = (address) => {
		return address ? address.replace(/\s+/g, '+') : '';
	};

	return (
		<div className='max-w-4xl mx-auto space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<button
					onClick={onBack}
					className='flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors'>
					<svg
						className='w-5 h-5 mr-2'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M15 19l-7-7 7-7'
						/>
					</svg>
					Back to Members
				</button>
				<div className='flex items-center space-x-4'>
					<button
						onClick={() => onEdit(member)}
						className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'>
						<Edit className='w-4 h-4 mr-2' />
						Edit Member
					</button>
					<h1 className='text-2xl font-bold text-gray-900'>Member Details</h1>
				</div>
			</div>
			{/* Member Information Card */}
			<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
				<div className='flex items-start space-x-6'>
					<div className='flex-shrink-0 h-20 w-20'>
						<div className='h-20 w-20 rounded-full bg-blue-500 flex items-center justify-center'>
							<span className='text-white font-medium text-2xl'>
								{member.name
									.split(' ')
									.map((n) => n[0])
									.join('')
									.toUpperCase()}
							</span>
						</div>
					</div>
					<div className='flex-1'>
						<h2 className='text-xl font-semibold text-gray-900'>
							{member.name}
						</h2>
						<p className='text-gray-600'>{member.gender}</p>
						<div className='mt-2 flex items-center space-x-4'>
							<span
								className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
									member.source === 'Mobile'
										? 'bg-green-100 text-green-800'
										: 'bg-blue-100 text-blue-800'
								}`}>
								{member.source}
							</span>
							<span
								className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
									member.is_verified
										? 'bg-green-100 text-green-800'
										: 'bg-yellow-100 text-yellow-800'
								}`}>
								{member.is_verified ? 'Verified' : 'Pending'}
							</span>
						</div>
					</div>
				</div>
			</div>
			{/* Details Grid */}
			<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
				{/* Personal Information */}
				<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
					<h3 className='text-lg font-semibold text-gray-900 mb-4'>
						Personal Information
					</h3>
					<div className='space-y-4'>
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
						<div>
							<label className='block text-sm font-medium text-gray-700'>
								Profile Status
							</label>
							<p className='text-sm text-gray-900'>
								{member.profile_completed ? 'Completed' : 'Incomplete'}
							</p>
						</div>
					</div>
				</div>

				{/* Contact Information */}
				<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
					<h3 className='text-lg font-semibold text-gray-900 mb-4'>
						Contact Information
					</h3>
					<div className='space-y-4'>
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
					</div>
				</div>
			</div>
			{/* Google Maps */}
			{member.address && (
				<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
					<h3 className='text-lg font-semibold text-gray-900 mb-4'>Location</h3>
					<div className='w-full h-96 rounded-lg overflow-hidden'>
						<iframe
							src={`https://www.google.com/maps?q=${formatAddress(
								member.address
							)}&output=embed`}
							width='100%'
							height='100%'
							style={{ border: 0 }}
							allowFullScreen=''
							loading='lazy'
							referrerPolicy='no-referrer-when-downgrade'></iframe>
					</div>
					<p className='text-sm text-gray-600 mt-2'>
						Address: {member.address}
					</p>
				</div>
			)}
		</div>
	);
};

export default Members;
