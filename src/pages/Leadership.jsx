import React, { useState, useEffect } from 'react';
import {
	Users,
	UserPlus,
	UserMinus,
	Crown,
	Shield,
	Heart,
	User,
} from 'lucide-react';

const Leadership = () => {
	const [leadershipData, setLeadershipData] = useState([]);
	const [eligibleMembers, setEligibleMembers] = useState([]);
	const [selectedRole, setSelectedRole] = useState(null);
	const [loading, setLoading] = useState(false);
	const [showAssignModal, setShowAssignModal] = useState(false);
	const [successMessage, setSuccessMessage] = useState('');
	const [errorMessage, setErrorMessage] = useState('');

	// API base URL - adjust this to match your backend
	const API_BASE = 'http://localhost:8000/api/leadership.php';

	useEffect(() => {
		fetchCurrentLeadership();
	}, []);

	const fetchCurrentLeadership = async () => {
		try {
			setLoading(true);
			const response = await fetch(`${API_BASE}?action=current-leadership`);
			const result = await response.json();

			if (result.success) {
				setLeadershipData(result.data);
			} else {
				setErrorMessage('Failed to load leadership data');
			}
		} catch (error) {
			setErrorMessage('Error fetching leadership data');
		} finally {
			setLoading(false);
		}
	};

	const fetchEligibleMembers = async (roleId) => {
		try {
			setLoading(true);
			const response = await fetch(
				`${API_BASE}?action=eligible-members&role_id=${roleId}`
			);
			const result = await response.json();

			if (result.success) {
				setEligibleMembers(result.data);
			} else {
				setErrorMessage(result.message || 'Failed to load eligible members');
				setEligibleMembers([]);
			}
		} catch (error) {
			setErrorMessage('Error fetching eligible members');
			setEligibleMembers([]);
		} finally {
			setLoading(false);
		}
	};

	const handleAssignRole = async (memberId) => {
		try {
			setLoading(true);
			const response = await fetch(API_BASE, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					action: 'assign-role',
					role_id: selectedRole.role_id,
					member_id: memberId,
				}),
			});

			const result = await response.json();

			if (result.success) {
				setSuccessMessage(`Role assigned successfully!`);
				setShowAssignModal(false);
				setSelectedRole(null);
				fetchCurrentLeadership();
			} else {
				setErrorMessage(result.message || 'Failed to assign role');
			}
		} catch (error) {
			setErrorMessage('Error assigning role');
		} finally {
			setLoading(false);
		}
	};

	const handleRemoveRole = async (assignmentId) => {
		if (
			!confirm('Are you sure you want to remove this leadership assignment?')
		) {
			return;
		}

		try {
			setLoading(true);
			const response = await fetch(API_BASE, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					action: 'remove-role',
					assignment_id: assignmentId,
				}),
			});

			const result = await response.json();

			if (result.success) {
				setSuccessMessage('Role removed successfully!');
				fetchCurrentLeadership();
			} else {
				setErrorMessage(result.message || 'Failed to remove role');
			}
		} catch (error) {
			setErrorMessage('Error removing role');
		} finally {
			setLoading(false);
		}
	};

	const openAssignModal = (role) => {
		setSelectedRole(role);
		setShowAssignModal(true);
		fetchEligibleMembers(role.role_id);
	};

	const closeModal = () => {
		setShowAssignModal(false);
		setSelectedRole(null);
		setEligibleMembers([]);
	};

	const getRoleIcon = (roleName) => {
		const name = roleName.toLowerCase();
		if (name.includes('pastor'))
			return <Crown className='w-5 h-5 text-yellow-500' />;
		if (name.includes('elder'))
			return <Shield className='w-5 h-5 text-blue-500' />;
		if (name.includes('youth'))
			return <Heart className='w-5 h-5 text-green-500' />;
		return <User className='w-5 h-5 text-gray-500' />;
	};

	const canAssignMore = (role) => {
		if (!role.max_allowed) return true;
		return role.assignments.length < role.max_allowed;
	};

	// Clear messages after 5 seconds
	useEffect(() => {
		if (successMessage || errorMessage) {
			const timer = setTimeout(() => {
				setSuccessMessage('');
				setErrorMessage('');
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [successMessage, errorMessage]);

	return (
		<div className='p-6 max-w-7xl mx-auto'>
			<div className='mb-8'>
				<h1 className='text-3xl font-bold text-gray-900 mb-2'>
					Leadership Management
				</h1>
				<p className='text-gray-600'>
					Manage church leadership roles and assignments
				</p>
			</div>

			{/* Messages */}
			{successMessage && (
				<div className='mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg'>
					{successMessage}
				</div>
			)}

			{errorMessage && (
				<div className='mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg'>
					{errorMessage}
				</div>
			)}

			{loading && (
				<div className='mb-6 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg'>
					Loading...
				</div>
			)}

			{/* Leadership Cards */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
				{leadershipData.map((role) => (
					<div
						key={role.role_id}
						className='bg-white rounded-lg shadow-md border hover:shadow-lg transition-shadow'>
						<div className='p-6'>
							<div className='flex items-center justify-between mb-4'>
								<div className='flex items-center space-x-3'>
									{getRoleIcon(role.role_name)}
									<h3 className='text-lg font-semibold text-gray-900'>
										{role.role_name}
									</h3>
								</div>
								<div className='text-sm text-gray-500'>
									{role.max_allowed
										? `${role.assignments.length}/${role.max_allowed}`
										: role.assignments.length}
								</div>
							</div>

							{role.description && (
								<p className='text-gray-600 text-sm mb-4'>{role.description}</p>
							)}

							{/* Current Assignments */}
							<div className='space-y-2 mb-4'>
								{role.assignments.length > 0 ? (
									role.assignments.map((assignment) => (
										<div
											key={assignment.assignment_id}
											className='flex items-center justify-between bg-gray-50 p-3 rounded-md'>
											<div>
												<p className='font-medium text-gray-900'>
													{assignment.first_name} {assignment.last_name}
												</p>
												<p className='text-sm text-gray-500'>
													Age {assignment.age} • {assignment.gender}
												</p>
											</div>
											<button
												onClick={() =>
													handleRemoveRole(assignment.assignment_id)
												}
												className='text-red-600 hover:text-red-800 p-1'
												title='Remove from role'>
												<UserMinus className='w-4 h-4' />
											</button>
										</div>
									))
								) : (
									<p className='text-gray-500 text-sm italic'>
										No assignments yet
									</p>
								)}
							</div>

							{/* Assign Button */}
							{canAssignMore(role) && (
								<button
									onClick={() => openAssignModal(role)}
									className='w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors'>
									<UserPlus className='w-4 h-4' />
									<span>Assign Member</span>
								</button>
							)}

							{!canAssignMore(role) && (
								<div className='w-full text-center text-sm text-gray-500 py-2 border border-gray-300 rounded-md'>
									Maximum assignments reached
								</div>
							)}
						</div>
					</div>
				))}
			</div>

			{/* Assign Role Modal */}
			{showAssignModal && selectedRole && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
					<div className='bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto'>
						<div className='p-6'>
							<div className='flex items-center justify-between mb-6'>
								<h2 className='text-xl font-bold text-gray-900'>
									Assign {selectedRole.role_name}
								</h2>
								<button
									onClick={closeModal}
									className='text-gray-400 hover:text-gray-600'>
									×
								</button>
							</div>

							{eligibleMembers.length > 0 ? (
								<div className='space-y-3'>
									<p className='text-gray-600 mb-4'>
										Select a member to assign to the {selectedRole.role_name}{' '}
										role:
									</p>
									{eligibleMembers.map((member) => (
										<div
											key={member.mid}
											className='flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50'>
											<div>
												<p className='font-medium text-gray-900'>
													{member.first_name} {member.last_name}
												</p>
												<p className='text-sm text-gray-500'>
													Age {member.age} • {member.gender}
												</p>
												{member.address && (
													<p className='text-sm text-gray-400'>
														{member.address}
													</p>
												)}
											</div>
											<button
												onClick={() => handleAssignRole(member.mid)}
												className='bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors'
												disabled={loading}>
												{loading ? 'Assigning...' : 'Assign'}
											</button>
										</div>
									))}
								</div>
							) : (
								<div className='text-center py-8'>
									<Users className='w-12 h-12 text-gray-400 mx-auto mb-4' />
									<p className='text-gray-500'>
										No eligible members found for this role.
									</p>
									<p className='text-sm text-gray-400 mt-2'>
										Members may not meet age, gender, or other requirements for
										this position.
									</p>
								</div>
							)}

							<div className='mt-6 flex justify-end space-x-3'>
								<button
									onClick={closeModal}
									className='px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50'>
									Cancel
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Leadership;
