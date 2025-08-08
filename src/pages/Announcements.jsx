import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, X, AlertCircle } from 'lucide-react';

// Replace with the actual URL of your PHP API
const API_URL = 'http://localhost:8000/api/announcements.php';

// Modal Component for Create/Edit Form and Delete Confirmation
const Modal = ({ children, onClose }) => (
	<div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4'>
		<div className='bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md relative animate-fade-in-up'>
			<button
				onClick={onClose}
				className='absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors'
				aria-label='Close modal'>
				<X size={24} />
			</button>
			{children}
		</div>
	</div>
);

// Form for creating and editing announcements
const AnnouncementForm = ({ announcement, onSave, onCancel }) => {
	const [title, setTitle] = useState('');
	const [content, setContent] = useState('');
	const [expiryDate, setExpiryDate] = useState('');
	const [errors, setErrors] = useState({});

	useEffect(() => {
		if (announcement) {
			setTitle(announcement.title || '');
			setContent(announcement.content || '');
			// The date from DB is 'YYYY-MM-DD', which is what the input type="date" expects
			setExpiryDate(announcement.expiry_date || '');
		} else {
			// Set default expiry to one week from today
			const nextWeek = new Date();
			nextWeek.setDate(nextWeek.getDate() + 7);
			setExpiryDate(nextWeek.toISOString().split('T')[0]);
		}
	}, [announcement]);

	const validateForm = () => {
		const newErrors = {};
		if (!title.trim()) newErrors.title = 'Title is required.';
		if (!content.trim()) newErrors.content = 'Content is required.';
		if (!expiryDate) newErrors.expiryDate = 'Expiry date is required.';
		else if (new Date(expiryDate) < new Date()) {
			newErrors.expiryDate = 'Expiry date cannot be in the past.';
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (validateForm()) {
			onSave({
				id: announcement?.id,
				title,
				content,
				expiry_date: expiryDate,
			});
		}
	};

	return (
		<form onSubmit={handleSubmit} className='p-6 space-y-4'>
			<h2 className='text-2xl font-bold text-gray-800 dark:text-white mb-4'>
				{announcement ? 'Edit Announcement' : 'New Announcement'}
			</h2>
			<div>
				<label
					htmlFor='title'
					className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
					Title
				</label>
				<input
					type='text'
					id='title'
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					className='mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
				/>
				{errors.title && (
					<p className='text-red-500 text-xs mt-1'>{errors.title}</p>
				)}
			</div>
			<div>
				<label
					htmlFor='content'
					className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
					Content
				</label>
				<textarea
					id='content'
					rows='4'
					value={content}
					onChange={(e) => setContent(e.target.value)}
					className='mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'></textarea>
				{errors.content && (
					<p className='text-red-500 text-xs mt-1'>{errors.content}</p>
				)}
			</div>
			<div>
				<label
					htmlFor='expiryDate'
					className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
					Expiry Date
				</label>
				<input
					type='date'
					id='expiryDate'
					value={expiryDate}
					onChange={(e) => setExpiryDate(e.target.value)}
					min={new Date().toISOString().split('T')[0]} // Prevent past dates
					className='mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
				/>
				{errors.expiryDate && (
					<p className='text-red-500 text-xs mt-1'>{errors.expiryDate}</p>
				)}
			</div>
			<div className='flex justify-end space-x-3 pt-4'>
				<button
					type='button'
					onClick={onCancel}
					className='px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors'>
					Cancel
				</button>
				<button
					type='submit'
					className='px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors'>
					Save Announcement
				</button>
			</div>
		</form>
	);
};

// Main Announcements Page Component
function Announcements() {
	const [announcements, setAnnouncements] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingAnnouncement, setEditingAnnouncement] = useState(null);
	const [deletingId, setDeletingId] = useState(null);

	const fetchAnnouncements = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await fetch(API_URL);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const result = await response.json();
			if (result.success) {
				setAnnouncements(result.data);
			} else {
				throw new Error(result.message || 'Failed to fetch announcements.');
			}
		} catch (e) {
			setError(e.message);
			console.error('Fetch error:', e);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchAnnouncements();
	}, [fetchAnnouncements]);

	const handleSave = async (announcementData) => {
		const isEditing = !!announcementData.id;
		const url = isEditing ? `${API_URL}?id=${announcementData.id}` : API_URL;
		const method = isEditing ? 'PUT' : 'POST';

		try {
			const response = await fetch(url, {
				method: method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(announcementData),
			});
			const result = await response.json();
			if (!result.success) {
				throw new Error(result.message || 'Failed to save announcement.');
			}
			closeModal();
			fetchAnnouncements(); // Refresh list
		} catch (e) {
			setError(e.message);
			console.error('Save error:', e);
		}
	};

	const handleDelete = async (id) => {
		try {
			const response = await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
			const result = await response.json();
			if (!result.success) {
				throw new Error(result.message || 'Failed to delete announcement.');
			}
			setDeletingId(null); // Close confirmation modal
			fetchAnnouncements(); // Refresh list
		} catch (e) {
			setError(e.message);
			console.error('Delete error:', e);
		}
	};

	const openModalForNew = () => {
		setEditingAnnouncement(null);
		setIsModalOpen(true);
	};

	const openModalForEdit = (announcement) => {
		setEditingAnnouncement(announcement);
		setIsModalOpen(true);
	};

	const closeModal = () => {
		setIsModalOpen(false);
		setEditingAnnouncement(null);
	};

	return (
		<div className='p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100'>
			<div className='max-w-7xl mx-auto'>
				<div className='flex justify-between items-center mb-6'>
					<h1 className='text-3xl font-bold'>Announcements</h1>
					<button
						onClick={openModalForNew}
						className='flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-transform transform hover:scale-105'>
						<Plus size={20} />
						New Announcement
					</button>
				</div>

				{isLoading && (
					<div className='text-center py-10'>Loading announcements...</div>
				)}

				{error && (
					<div
						className='bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6'
						role='alert'>
						<p className='font-bold'>Error</p>
						<p>{error}</p>
					</div>
				)}

				{!isLoading && !error && announcements.length === 0 && (
					<div className='text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md'>
						<AlertCircle className='mx-auto h-12 w-12 text-gray-400' />
						<h3 className='mt-2 text-lg font-medium text-gray-900 dark:text-white'>
							No Active Announcements
						</h3>
						<p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
							Get started by creating a new announcement.
						</p>
					</div>
				)}

				<div className='space-y-4'>
					{announcements.map((ann) => (
						<div
							key={ann.id}
							className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 transition-shadow hover:shadow-lg animate-fade-in'>
							<div className='flex justify-between items-start'>
								<div>
									<h2 className='text-xl font-bold text-indigo-600 dark:text-indigo-400'>
										{ann.title}
									</h2>
									<p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
										Expires on: {new Date(ann.expiry_date).toLocaleDateString()}
									</p>
								</div>
								<div className='flex items-center gap-2'>
									<button
										onClick={() => openModalForEdit(ann)}
										className='p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors'
										aria-label='Edit'>
										<Edit size={18} />
									</button>
									<button
										onClick={() => setDeletingId(ann.id)}
										className='p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors'
										aria-label='Delete'>
										<Trash2 size={18} />
									</button>
								</div>
							</div>
							<p className='mt-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap'>
								{ann.content}
							</p>
						</div>
					))}
				</div>
			</div>

			{isModalOpen && (
				<Modal onClose={closeModal}>
					<AnnouncementForm
						announcement={editingAnnouncement}
						onSave={handleSave}
						onCancel={closeModal}
					/>
				</Modal>
			)}

			{deletingId && (
				<Modal onClose={() => setDeletingId(null)}>
					<div className='p-6 text-center'>
						<AlertCircle className='mx-auto h-12 w-12 text-red-500' />
						<h3 className='mt-4 text-lg font-semibold text-gray-900 dark:text-white'>
							Delete Announcement?
						</h3>
						<p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
							Are you sure you want to delete this announcement? This action
							cannot be undone.
						</p>
						<div className='mt-6 flex justify-center gap-4'>
							<button
								onClick={() => setDeletingId(null)}
								className='px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300'>
								Cancel
							</button>
							<button
								onClick={() => handleDelete(deletingId)}
								className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700'>
								Yes, Delete
							</button>
						</div>
					</div>
				</Modal>
			)}
		</div>
	);
}

export default Announcements;
