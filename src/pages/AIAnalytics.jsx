import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	LineChart,
	Line,
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
} from 'recharts';
import {
	Brain,
	FileText,
	TrendingUp,
	Users,
	Calendar,
	Download,
	Loader,
	AlertCircle,
	Sparkles,
	MessageSquare,
	Send,
} from 'lucide-react';
import { AnalyticsContext } from '../layouts/AdminLayout';
import { jsPDF } from 'jspdf';
import { marked } from 'marked';

const getStyledHtml = (title, htmlContent) => {
		return `
			<div style="font-family: 'Helvetica', 'sans-serif'; font-size: 10pt; line-height: 1.5; max-width: 180mm;">
				<style>
					h1, h2, h3, h4, h5, h6 { margin-bottom: 8px; }
					p { margin-bottom: 12px; }
					ul, ol { margin-bottom: 12px; padding-left: 20px; }
					li { margin-bottom: 4px; }
				</style>
				<h1>${title}</h1>
				${htmlContent}
			</div>
		`;
	};

// Define your backend API URLs here
// IMPORTANT: Ensure these URLs correctly point to your running PHP backend.
// If your PHP server is on a different port (e.g., 8000), update localhost: to localhost:8000/
const REPORTS_API_URL = 'http://localhost:8000/api/ai_reports.php'; // Replace with your actual reports API URL

const AIAnalytics = () => {
	const [activeTab, setActiveTab] = useState('analytics');
	const {
		analyticsState,
		reportData,
		setReportData,
		customQueryData,
		setCustomQueryData,
		error,
		setError,
		fetchAnalytics,
	} = useContext(AnalyticsContext);

	// Load analytics data on component mount or tab switch
	useEffect(() => {
		if (activeTab === 'analytics' && !analyticsState.data && !analyticsState.loading) {
			fetchAnalytics();
		}
	}, [activeTab, analyticsState.data, analyticsState.loading, fetchAnalytics]);

	// AI Report Generation Component
	const ReportGeneration = ({ reportData, setReportData, setError }) => {
		const [reportType, setReportType] = useState('membership_summary');
		const [reportPeriod, setReportPeriod] = useState('last_30_days');
		const [generatingReport, setGeneratingReport] = useState(false);

		const reportTypes = [
			{ value: 'membership_summary', label: 'Membership Summary' },
			{ value: 'growth_analysis', label: 'Growth Analysis' },
			{ value: 'demographic_insights', label: 'Demographic Insights' },
			{ value: 'engagement_metrics', label: 'Engagement Metrics' },
			{ value: 'area_report', label: 'Area Report' },
		];

		const periods = [
			{ value: 'last_7_days', label: 'Last 7 Days' },
			{ value: 'last_30_days', label: 'Last 30 Days' },
			{ value: 'last_90_days', label: 'Last 90 Days' },
			{ value: 'last_year', label: 'Last Year' },
			{ value: 'all_time', label: 'All Time' },
		];

		const generateAIReport = useCallback(async () => {
			if (generatingReport) return;

			setGeneratingReport(true);
			setError(null);

			try {
				const payload = {
					report_type: reportType,
					period: reportPeriod,
				};

				// Log the URL and payload to help debug
				console.log(
					'Attempting to generate report from:',
					REPORTS_API_URL,
					'with payload:',
					payload
				);

				const response = await fetch(REPORTS_API_URL, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(payload),
				});

				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(
						`HTTP error! status: ${response.status}, message: ${errorText}`
					);
				}
				const data = await response.json();
				if (data.success) {
					setReportData(data.report);
				} else {
					setError(data.message || 'Failed to generate report from API');
				}
			} catch (err) {
				setError(
					'Error generating AI report. Please check your connection and API endpoint.'
				);
				console.error('AI Report Generation Error:', err);
			} finally {
				setGeneratingReport(false);
			}
		}, [
			reportType,
			reportPeriod,
			generatingReport,
			setReportData,
			setError,
		]);

		const downloadReport = async () => {
			if (!reportData) return;

			const doc = new jsPDF({
				orientation: 'p',
				unit: 'mm',
				format: 'a4'
			});

			// Custom renderer for marked to remove horizontal rules
			const renderer = new marked.Renderer();
			renderer.hr = () => ''; // Render nothing for <hr> tags

			const htmlContent = await marked(reportData.content, { renderer });

			// Add more specific styling for paragraphs and headings
			const styledHtml = `
				<div style="font-family: 'Helvetica', 'sans-serif'; font-size: 10pt; line-height: 1.5; max-width: 180mm;">
					<style>
						h1, h2, h3, h4, h5, h6 { margin-bottom: 8px; }
						p { margin-bottom: 12px; }
						ul, ol { margin-bottom: 12px; padding-left: 20px; }
						li { margin-bottom: 4px; }
					</style>
					<h1>${reportData.title}</h1>
					${htmlContent}
				</div>
			`;

			doc.html(styledHtml, {
				callback: function (doc) {
					const fileName = `${reportData.title.replace(/ /g, '_')}.pdf`;
					doc.save(fileName);
				},
				margin: [15, 15, 15, 15], // top, right, bottom, left
				autoPaging: 'slice', // Try 'slice' for better page breaking
				x: 15,
				y: 15,
				width: 180,
				windowWidth: 800
			});
		};

		return (
			<div className='space-y-6'>
				<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
					<h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
						<FileText className='w-5 h-5 mr-2' />
						AI Report Generation
					</h3>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Report Type
							</label>
							<select
								value={reportType}
								onChange={(e) => setReportType(e.target.value)}
								className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'>
								{reportTypes.map((type) => (
									<option key={type.value} value={type.value}>
										{type.label}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Time Period
							</label>
							<select
								value={reportPeriod}
								onChange={(e) => setReportPeriod(e.target.value)}
								className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'>
								{periods.map((period) => (
									<option key={period.value} value={period.value}>
										{period.label}
									</option>
								))}
							</select>
						</div>
						{reportType === 'custom_analysis' && (
							<div className='md:col-span-2'>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Address Search Term (for Custom Analysis)
								</label>
								<input
									type='text'
									value={addressTerm}
									onChange={(e) => setAddressTerm(e.target.value)}
									placeholder='e.g., "Main Street" or "Downtown"'
									className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
								/>
							</div>
						)}
					</div>

					<button
						onClick={generateAIReport}
						disabled={
							generatingReport ||
							(reportType === 'custom_analysis' && !addressTerm.trim())
						}
						className='flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 w-full sm:w-auto'>
						{generatingReport ? (
							<>
								<Loader className='w-5 h-5 mr-2 animate-spin' />
								Generating Report...
							</>
						) : (
							<>
								<Brain className='w-5 h-5 mr-2' />
								Generate AI Report
							</>
						)}
					</button>
				</div>

				{reportData && (
					<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in'>
						<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4'>
							<h4 className='text-xl font-bold text-gray-900 mb-2 sm:mb-0'>
								{reportData.title}
							</h4>
							<div className='flex space-x-2'>
								<button
									onClick={downloadReport}
									className='flex items-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm'>
									<Download className='w-4 h-4 mr-1' />
									Download PDF
								</button>
							</div>
						</div>

						<div className='prose max-w-none'>
							<div className='bg-gray-50 p-4 rounded-lg border border-gray-200'>
								<pre className='whitespace-pre-wrap text-sm text-gray-800 font-sans'>
									{reportData.content}
								</pre>
							</div>
						</div>

						<div className='mt-4 text-xs text-gray-500'>
							Generated on: {new Date(reportData.generated_at).toLocaleString()}
						</div>
					</div>
				)}
			</div>
		);
	};

	// Smart Analytics Component
	const SmartAnalytics = ({ analyticsData, analyticsLoading, onRefresh }) => {
		const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF5733', '#C70039', '#900C3F'];

		if (analyticsLoading) {
			return (
				<div className='flex items-center justify-center h-96'>
					<Loader className='w-12 h-12 animate-spin text-blue-600' />
				</div>
			);
		}

		if (!analyticsData) {
			return (
				<div className='text-center py-8 bg-white rounded-xl shadow-sm border border-gray-200'>
					<p className='mb-4 text-gray-600'>
						Failed to load data or no data available.
					</p>
					<button
						onClick={onRefresh}
						disabled={analyticsLoading}
						className='flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto'>
						{analyticsLoading ? (
							<Loader className='w-4 h-4 mr-2 animate-spin' />
						) : (
							<TrendingUp className='w-4 h-4 mr-2' />
						)}
						{analyticsLoading
							? 'Loading Analytics...'
							: 'Retry Loading Analytics'}
					</button>
				</div>
			);
		}

		return (
			<div className='space-y-6 animate-fade-in'>
				{/* Key Metrics */}
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
					<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-gray-600'>
									Total Members
								</p>
								<p className='text-3xl font-bold text-gray-900'>
									{analyticsData.total_members.toLocaleString()}
								</p>
							</div>
							<div className='bg-blue-100 p-3 rounded-full'>
								<Users className='w-6 h-6 text-blue-600' />
							</div>
						</div>
						<p className='text-sm text-green-600 mt-2 flex items-center'>
							<TrendingUp className='w-4 h-4 mr-1' />
							{analyticsData.growth_rate}% from last month
						</p>
					</div>

					<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-gray-600'>
									Mobile Users
								</p>
								<p className='text-3xl font-bold text-gray-900'>
									{analyticsData.mobile_users.toLocaleString()}
								</p>
							</div>
							<div className='bg-green-100 p-3 rounded-full'>
								<TrendingUp className='w-6 h-6 text-green-600' />
							</div>
						</div>
						<p className='text-sm text-gray-600 mt-2'>
							{analyticsData.mobile_percentage}% of total users
						</p>
					</div>

					<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-gray-600'>
									Verified Members
								</p>
								<p className='text-3xl font-bold text-gray-900'>
									{analyticsData.verified_members.toLocaleString()}
								</p>
							</div>
							<div className='bg-purple-100 p-3 rounded-full'>
								<Calendar className='w-6 h-6 text-purple-600' />
							</div>
						</div>
						<p className='text-sm text-gray-600 mt-2'>
							{analyticsData.verification_rate}% verification rate
						</p>
					</div>

					<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-gray-600'>Avg. Age</p>
								<p className='text-3xl font-bold text-gray-900'>
									{analyticsData.average_age} yrs
								</p>
							</div>
							<div className='bg-yellow-100 p-3 rounded-full'>
								<Sparkles className='w-6 h-6 text-yellow-600' />
							</div>
						</div>
						<p className='text-sm text-gray-600 mt-2'>
							Most common: {analyticsData.most_common_age_group}
						</p>
					</div>
				</div>

				{/* Charts */}
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
					<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
						<h4 className='text-lg font-semibold text-gray-900 mb-4'>
							Membership Growth Trend (Last 7 Days)
						</h4>
						<ResponsiveContainer width='100%' height={300}>
							<LineChart data={analyticsData.growth_data}>
								<CartesianGrid strokeDasharray='3 3' />
								<XAxis dataKey='month' />
								<YAxis />
								<Tooltip />
								<Legend />
								<Line
									type='monotone'
									dataKey='members'
									stroke='#8884d8'
									strokeWidth={2}
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>

					<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
						<h4 className='text-lg font-semibold text-gray-900 mb-4'>
							Gender Distribution
						</h4>
						<ResponsiveContainer width='100%' height={300}>
							<PieChart>
								<Pie
									data={analyticsData.gender_distribution}
									cx='50%'
									cy='50%'
									labelLine={false}
									label={({ name, percent, value }) =>
										`${name}: ${value} (${(percent * 100).toFixed(0)}%)`
									}
									outerRadius={100}
									fill='#8884d8'
									dataKey='value'>
									{analyticsData.gender_distribution.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={COLORS[index % COLORS.length]}
										/>
									))}
								</Pie>
								<Tooltip />
								<Legend />
							</PieChart>
						</ResponsiveContainer>
					</div>

					<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
						<h4 className='text-lg font-semibold text-gray-900 mb-4'>
							Registration Source
						</h4>
						<ResponsiveContainer width='100%' height={300}>
							<BarChart data={analyticsData.source_distribution}>
								<CartesianGrid strokeDasharray='3 3' />
								<XAxis dataKey='source' />
								<YAxis />
								<Tooltip />
								<Legend />
								<Bar dataKey='count' fill='#8884d8' />
							</BarChart>
						</ResponsiveContainer>
					</div>

					<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
						<h4 className='text-lg font-semibold text-gray-900 mb-4'>
							Age Distribution
						</h4>
						<ResponsiveContainer width='100%' height={300}>
							<BarChart data={analyticsData.age_distribution}>
								<CartesianGrid strokeDasharray='3 3' />
								<XAxis dataKey='age_group' />
								<YAxis />
								<Tooltip />
								<Legend />
								<Bar dataKey='count' fill='#82ca9d' />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* AI Insights */}
				<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
					<h4 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
						<Brain className='w-6 h-6 mr-2 text-blue-600' />
						AI-Generated Insights
					</h4>
					<div className='space-y-4'>
						{analyticsData.ai_insights.map((insight, index) => (
							<div
								key={index}
								className='bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4'>
								<div className='flex items-start space-x-3'>
									<Sparkles className='w-5 h-5 text-blue-600 mt-1 flex-shrink-0' />
									<div>
										<h5 className='font-semibold text-blue-900'>
											{insight.title}
										</h5>
										<p className='text-blue-800 mt-1 text-sm'>
											{insight.description}
										</p>
										{insight.recommendation && (
											<p className='text-blue-700 mt-2 font-medium text-sm bg-blue-100 p-2 rounded-md'>
												💡 Recommendation: {insight.recommendation}
											</p>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	};

	// Custom AI Query Component
	const CustomAIQuery = ({ customQueryData, setCustomQueryData, setError }) => {
		const [customPrompt, setCustomPrompt] = useState('');
		const [queryLoading, setQueryLoading] = useState(false);
		const [queryHistory, setQueryHistory] = useState([]); // This will store past queries and their responses

		const downloadCustomReport = async () => {
			if (!customQueryData) return;

			const doc = new jsPDF({
				orientation: 'p',
				unit: 'mm',
				format: 'a4'
			});

			const renderer = new marked.Renderer();
			renderer.hr = () => '';

			const htmlContent = await marked(customQueryData.response, { renderer });

			const styledHtml = `
				<div style="font-family: 'Helvetica', 'sans-serif'; font-size: 10pt; line-height: 1.5; max-width: 180mm;">
					<style>
						h1, h2, h3, h4, h5, h6 { margin-bottom: 8px; }
						p { margin-bottom: 12px; }
						ul, ol { margin-bottom: 12px; padding-left: 20px; }
						li { margin-bottom: 4px; }
					</style>
					<h1>Custom AI Analysis</h1>
					<h3>Your Prompt:</h3>
					<p>${customQueryData.prompt}</p>
					<hr />
					<h3>AI Response:</h3>
					${htmlContent}
				</div>
			`;

			doc.html(styledHtml, {
				callback: function (doc) {
					const fileName = `Custom_AI_Analysis.pdf`;
					doc.save(fileName);
				},
				margin: [15, 15, 15, 15],
				autoPaging: 'slice',
				x: 15,
				y: 15,
				width: 180,
				windowWidth: 800
			});
		};

		const executeCustomQuery = useCallback(async () => {
			if (!customPrompt.trim() || queryLoading) return;

			setQueryLoading(true);
			setError(null);

			try {
				// For custom query, we'll use the 'custom_analysis' report type
				// and send the 'customPrompt' as a 'user_query' field.
				const payload = {
					report_type: 'custom_analysis',
					period: 'all_time', // Or make this selectable if needed
					user_query: customPrompt, // This is the user's free-form query
				};

				// Log the URL and payload to help debug
				console.log(
					'Attempting to execute custom query from:',
					REPORTS_API_URL,
					'with payload:',
					payload
				);

				const response = await fetch(REPORTS_API_URL, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(payload),
				});

				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(
						`HTTP error! status: ${response.status}, message: ${errorText}`
					);
				}
				const data = await response.json();

				if (data.success) {
					const newQuery = {
						id: Date.now(),
						prompt: customPrompt,
						response: data.report.content, // Get content from the report
						timestamp: new Date(),
					};

					setCustomQueryData(newQuery); // Set the latest response
					setQueryHistory((prev) => [newQuery, ...prev.slice(0, 4)]); // Keep last 5 queries
					setCustomPrompt(''); // Clear the input
				} else {
					setError(data.message || 'Failed to execute custom query from API');
				}
			} catch (err) {
				setError(
					'Error executing custom AI query. Please check your connection and API endpoint.'
				);
				console.error('Custom Query Error:', err);
			} finally {
				setQueryLoading(false);
			}
		}, [customPrompt, queryLoading, setCustomQueryData, setError]);

		const handleKeyPress = (e) => {
			if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				executeCustomQuery();
			}
		};

		return (
			<div className='space-y-6 animate-fade-in'>
				<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
					<h3 className='text-lg font-semibold text-gray-900 mb-2 flex items-center'>
						<MessageSquare className='w-5 h-5 mr-2' />
						Custom AI Query
					</h3>

					<p className='text-gray-600 mb-4 text-sm'>
						Ask AI anything about your database data. Use natural language to
						get insights, trends, and analysis.
					</p>

					<div className='space-y-4'>
						<div>
							<textarea
								value={customPrompt}
								onChange={(e) => setCustomPrompt(e.target.value)}
								onKeyDown={handleKeyPress}
								placeholder="e.g., 'What is the primary source of registration for female members over 40?'"
								className='w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-vertical'
								disabled={queryLoading}
							/>
							<p className='text-xs text-gray-500 mt-1'>
								Tip: Press Ctrl+Enter (Cmd+Enter on Mac) to submit.
							</p>
						</div>

						<button
							onClick={executeCustomQuery}
							disabled={queryLoading || !customPrompt.trim()}
							className='flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 w-full sm:w-auto'>
							{queryLoading ? (
								<>
									<Loader className='w-5 h-5 mr-2 animate-spin' />
									Analyzing...
								</>
							) : (
								<>
									<Send className='w-5 h-5 mr-2' />
									Ask AI
								</>
							)}
						</button>
					</div>
				</div>

				{queryLoading && !customQueryData && (
					<div className='flex flex-col items-center justify-center h-40 bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
						<Loader className='w-8 h-8 animate-spin text-purple-600' />
						<p className='mt-4 text-purple-800 font-medium'>
							AI is thinking...
						</p>
					</div>
				)}

				{customQueryData && (
					<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in'>
						<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4'>
							<h4 className='text-xl font-bold text-gray-900 mb-2 sm:mb-0'>
								AI Response to Your Query
							</h4>
							<button
								onClick={downloadCustomReport}
								className='flex items-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm'>
								<Download className='w-4 h-4 mr-1' />
								Download PDF
							</button>
						</div>
						<div className='prose max-w-none'>
							<div className='bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4'>
								<p className='text-sm text-gray-800 font-semibold mb-2'>
									Your Prompt:
								</p>
								<pre className='whitespace-pre-wrap text-sm text-gray-700 font-sans'>
									{customQueryData.prompt}
								</pre>
							</div>
							<div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
								<p className='text-sm text-blue-900 font-semibold mb-2'>
									AI Analysis:
								</p>
								<pre className='whitespace-pre-wrap text-sm text-blue-800 font-sans'>
									{customQueryData.response}
								</pre>
							</div>
						</div>
						<div className='mt-4 text-xs text-gray-500'>
							Response generated on:{' '}
							{new Date(customQueryData.timestamp).toLocaleString()}
						</div>
					</div>
				)}

				{queryHistory.length > 0 && (
					<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
						<h4 className='text-lg font-semibold text-gray-900 mb-4'>
							Query History
						</h4>
						<div className='space-y-4'>
							{queryHistory.map((entry) => (
								<div
									key={entry.id}
									className='bg-gray-100 p-4 rounded-lg border border-gray-200'>
									<p className='font-semibold text-gray-800 text-sm'>
										Prompt: {entry.prompt}
									</p>
									<p className='text-gray-600 text-xs mt-1'>
										{new Date(entry.timestamp).toLocaleString()}
									</p>
									<p
										className='text-blue-700 text-sm mt-2 cursor-pointer hover:underline'
										onClick={() => setCustomQueryData(entry)}>
										View Response
									</p>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		);
	};

	return (
		<div className='min-h-screen bg-gray-100 p-4 sm:p-6 font-sans antialiased'>
			<style>
				{`
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .resize-vertical {
                    resize: vertical;
                }
                `}
			</style>
			<div className='max-w-7xl mx-auto'>
				<h1 className='text-4xl font-extrabold text-gray-900 mb-8 text-center'>
					AI-Powered Membership Analytics & Reports
				</h1>

				{error && (
					<div
						className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-6 flex items-center'
						role='alert'>
						<AlertCircle className='w-5 h-5 mr-3 flex-shrink-0' />
						<span className='block sm:inline'>{error}</span>
						<button
							onClick={() => setError(null)}
							className='absolute top-0 bottom-0 right-0 px-4 py-3'>
							<svg
								className='fill-current h-6 w-6 text-red-500'
								role='button'
								xmlns='http://www.w3.org/2000/svg'
								viewBox='0 0 20 20'>
								<title>Close</title>
								<path d='M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.196l-2.651 3.653a1.2 1.2 0 1 1-1.697-1.697l3.653-2.651-3.653-2.651a1.2 1.2 0 0 1 1.697-1.697L10 8.804l2.651-3.653a1.2 1.2 0 0 1 1.697 1.697L11.196 10l3.653 2.651a1.2 1.2 0 0 1 0 1.698z' />
							</svg>
						</button>
					</div>
				)}

				<div className='flex mb-8 space-x-4 border-b border-gray-200'>
					<button
						onClick={() => setActiveTab('analytics')}
						className={`px-6 py-3 text-lg font-medium rounded-t-lg transition-colors ${
							activeTab === 'analytics'
								? 'bg-white text-blue-600 border-b-2 border-blue-600'
								: 'text-gray-600 hover:text-gray-900'
						}`}>
						Smart Analytics
					</button>
					<button
						onClick={() => setActiveTab('reports')}
						className={`px-6 py-3 text-lg font-medium rounded-t-lg transition-colors ${
							activeTab === 'reports'
								? 'bg-white text-blue-600 border-b-2 border-blue-600'
								: 'text-gray-600 hover:text-gray-900'
						}`}>
						AI Reports
					</button>
					<button
						onClick={() => setActiveTab('custom-query')}
						className={`px-6 py-3 text-lg font-medium rounded-t-lg transition-colors ${
							activeTab === 'custom-query'
								? 'bg-white text-blue-600 border-b-2 border-blue-600'
								: 'text-gray-600 hover:text-gray-900'
						}`}>
						Custom AI Query
					</button>
				</div>

				{activeTab === 'analytics' && (
					<SmartAnalytics
						analyticsData={analyticsState.data}
						analyticsLoading={analyticsState.loading}
						onRefresh={fetchAnalytics}
					/>
				)}
				{activeTab === 'reports' && (
					<ReportGeneration
						reportData={reportData}
						setReportData={setReportData}
						setError={setError}
					/>
				)}
				{activeTab === 'custom-query' && (
					<CustomAIQuery
						customQueryData={customQueryData}
						setCustomQueryData={setCustomQueryData}
						setError={setError}
					/>
				)}
			</div>
		</div>
	);
};

export default AIAnalytics;
