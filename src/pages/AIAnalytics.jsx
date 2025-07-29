import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';

const AIAnalytics = () => {
    const [activeTab, setActiveTab] = useState('reports');
    // These states are managed here to ensure data persistence across tab switches
    // and for passing down to children.
    const [analyticsData, setAnalyticsData] = useState(null);
    const [predictiveData, setPredictiveData] = useState(null);
    const [reportData, setReportData] = useState(null); // For generated reports
    const [error, setError] = useState(null);

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
            { value: 'custom_analysis', label: 'Custom Analysis' },
        ];

        const periods = [
            { value: 'last_7_days', label: 'Last 7 Days' },
            { value: 'last_30_days', label: 'Last 30 Days' },
            { value: 'last_90_days', label: 'Last 90 Days' },
            { value: 'last_year', label: 'Last Year' },
            { value: 'all_time', label: 'All Time' },
        ];

        // useCallback to memoize the function, preventing unnecessary re-creation
        const generateAIReport = useCallback(async () => {
            if (generatingReport) return; // Prevent multiple clicks

            setGeneratingReport(true);
            setError(null);

            try {
                const response = await fetch(
                    'http://localhost:8000/api/ai_reports.php',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            report_type: reportType,
                            period: reportPeriod,
                        }),
                    }
                );

                const data = await response.json();

                if (data.success) {
                    setReportData(data.report);
                } else {
                    setError(data.message || 'Failed to generate report');
                }
            } catch (err) {
                setError('Error generating AI report');
                console.error('AI Report Generation Error:', err);
            } finally {
                setGeneratingReport(false);
            }
        }, [reportType, reportPeriod, generatingReport, setReportData, setError]); // Dependencies

        const downloadReport = (format = 'pdf') => {
            if (!reportData) return;

            const element = document.createElement('a');
            const file = new Blob([reportData.content], {
                type: format === 'pdf' ? 'application/pdf' : 'text/plain',
            });
            element.href = URL.createObjectURL(file);
            element.download = `${reportData.title}.${format}`;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
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
                    </div>

                    <button
                        onClick={generateAIReport}
                        disabled={generatingReport}
                        className='flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50'>
                        {generatingReport ? (
                            <>
                                <Loader className='w-4 h-4 mr-2 animate-spin' />
                                Generating Report...
                            </>
                        ) : (
                            <>
                                <Brain className='w-4 h-4 mr-2' />
                                Generate AI Report
                            </>
                        )}
                    </button>
                </div>

                {reportData && (
                    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                        <div className='flex justify-between items-center mb-4'>
                            <h4 className='text-lg font-semibold text-gray-900'>
                                {reportData.title}
                            </h4>
                            <div className='flex space-x-2'>
                                <button
                                    onClick={() => downloadReport('pdf')}
                                    className='flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors'>
                                    <Download className='w-4 h-4 mr-1' />
                                    PDF
                                </button>
                                <button
                                    onClick={() => downloadReport('txt')}
                                    className='flex items-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors'>
                                    <Download className='w-4 h-4 mr-1' />
                                    TXT
                                </button>
                            </div>
                        </div>

                        <div className='prose max-w-none'>
                            <div className='bg-gray-50 p-4 rounded-lg'>
                                <pre className='whitespace-pre-wrap text-sm text-gray-800'>
                                    {reportData.content}
                                </pre>
                            </div>
                        </div>

                        <div className='mt-4 text-sm text-gray-500'>
                            Generated on:{' '}
                            {new Date(reportData.generated_at).toLocaleString()}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Smart Analytics Component
    const SmartAnalytics = ({ analyticsData, setAnalyticsData, setError }) => {
        const [analyticsLoading, setAnalyticsLoading] = useState(false);
        const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

        // useCallback to memoize the function, preventing unnecessary re-creation
        const fetchAnalytics = useCallback(async () => {
            // Defensive check: only fetch if not already loading AND no data exists
            if (analyticsLoading || analyticsData) {
                console.log('SmartAnalytics: Skipping fetch. Already loading or data exists.');
                return;
            }

            console.log('SmartAnalytics: Initiating fetch for analytics...');
            setAnalyticsLoading(true);
            setError(null); // Clear parent error state

            try {
                const response = await fetch(
                    'http://localhost:8000/api/ai_analytics.php'
                );
                const data = await response.json();

                if (data.success) {
                    setAnalyticsData(data.analytics);
                } else {
                    setError(data.message || 'Failed to fetch analytics');
                }
            } catch (err) {
                setError('Error fetching analytics');
                console.error('Analytics Error:', err);
            } finally {
                setAnalyticsLoading(false);
            }
        }, [analyticsLoading, analyticsData, setAnalyticsData, setError]); // Dependencies

        // useEffect to fetch data on component mount
        useEffect(() => {
            console.log('SmartAnalytics: useEffect triggered (mount/remount)');
            fetchAnalytics();
        }, [fetchAnalytics]); // Dependency on fetchAnalytics memoized function

        return (
            <div className='space-y-6'>
                {analyticsLoading ? (
                    <div className='flex items-center justify-center h-64'>
                        <Loader className='w-8 h-8 animate-spin text-blue-600' />
                    </div>
                ) : analyticsData ? (
                    <>
                        {/* Key Metrics */}
                        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                                <div className='flex items-center justify-between'>
                                    <div>
                                        <p className='text-sm font-medium text-gray-600'>
                                            Total Members
                                        </p>
                                        <p className='text-2xl font-bold text-gray-900'>
                                            {analyticsData.total_members}
                                        </p>
                                    </div>
                                    <Users className='w-8 h-8 text-blue-600' />
                                </div>
                                <p className='text-sm text-green-600 mt-2'>
                                    +{analyticsData.growth_rate}% from last month
                                </p>
                            </div>

                            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                                <div className='flex items-center justify-between'>
                                    <div>
                                        <p className='text-sm font-medium text-gray-600'>
                                            Mobile Users
                                        </p>
                                        <p className='text-2xl font-bold text-gray-900'>
                                            {analyticsData.mobile_users}
                                        </p>
                                    </div>
                                    <TrendingUp className='w-8 h-8 text-green-600' />
                                </div>
                                <p className='text-sm text-blue-600 mt-2'>
                                    {analyticsData.mobile_percentage}% of total
                                </p>
                            </div>

                            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                                <div className='flex items-center justify-between'>
                                    <div>
                                        <p className='text-sm font-medium text-gray-600'>
                                            Verified Members
                                        </p>
                                        <p className='text-2xl font-bold text-gray-900'>
                                            {analyticsData.verified_members}
                                        </p>
                                    </div>
                                    <Calendar className='w-8 h-8 text-purple-600' />
                                </div>
                                <p className='text-sm text-purple-600 mt-2'>
                                    {analyticsData.verification_rate}% verification rate
                                </p>
                            </div>

                            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                                <div className='flex items-center justify-between'>
                                    <div>
                                        <p className='text-sm font-medium text-gray-600'>
                                            Avg. Age
                                        </p>
                                        <p className='text-2xl font-bold text-gray-900'>
                                            {analyticsData.average_age} yrs
                                        </p>
                                    </div>
                                    <Sparkles className='w-8 h-8 text-yellow-600' />
                                </div>
                                <p className='text-sm text-gray-600 mt-2'>
                                    Most common: {analyticsData.most_common_age_group}
                                </p>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                            {/* Membership Growth Chart */}
                            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                                <h4 className='text-lg font-semibold text-gray-900 mb-4'>
                                    Membership Growth Trend
                                </h4>
                                <ResponsiveContainer width='100%' height={300}>
                                    <LineChart data={analyticsData.growth_data}>
                                        <CartesianGrid strokeDasharray='3 3' />
                                        <XAxis dataKey='month' />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type='monotone' dataKey='members' stroke='#8884d8' />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Gender Distribution */}
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
                                            label={({ name, percent }) =>
                                                `${name} ${(percent * 100).toFixed(0)}%`
                                            }
                                            outerRadius={80}
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
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Source Distribution */}
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

                            {/* Age Distribution */}
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
                                <Brain className='w-5 h-5 mr-2' />
                                AI-Generated Insights
                            </h4>
                            <div className='space-y-4'>
                                {analyticsData.ai_insights.map((insight, index) => (
                                    <div
                                        key={index}
                                        className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                                        <div className='flex items-start space-x-3'>
                                            <Sparkles className='w-5 h-5 text-blue-600 mt-0.5' />
                                            <div>
                                                <h5 className='font-semibold text-blue-900'>
                                                    {insight.title}
                                                </h5>
                                                <p className='text-blue-800 mt-1'>
                                                    {insight.description}
                                                </p>
                                                {insight.recommendation && (
                                                    <p className='text-blue-700 mt-2 font-medium'>
                                                        💡 Recommendation: {insight.recommendation}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className='text-center py-8'>
                        <button
                            onClick={fetchAnalytics}
                            // Only enable if not already loading
                            disabled={analyticsLoading}
                            className='flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto'>
                            {analyticsLoading ? (
                                <Loader className='w-4 h-4 mr-2 animate-spin' />
                            ) : (
                                <TrendingUp className='w-4 h-4 mr-2' />
                            )}
                            {analyticsLoading ? 'Loading Analytics...' : 'Load Analytics'}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // Predictive Analysis Component
    const PredictiveAnalysis = ({ predictiveData, setPredictiveData, setError }) => {
        const [predictionType, setPredictionType] = useState('membership_growth');
        const [predictionPeriod, setPredictionPeriod] = useState('next_6_months');
        const [loadingPredictions, setLoadingPredictions] = useState(false);

        const predictionTypes = [
            { value: 'membership_growth', label: 'Membership Growth' },
            { value: 'churn_risk', label: 'Member Churn Risk' },
            { value: 'engagement_trends', label: 'Engagement Trends' },
            { value: 'demographic_shifts', label: 'Demographic Shifts' },
        ];

        const predictionPeriods = [
            { value: 'next_3_months', label: 'Next 3 Months' },
            { value: 'next_6_months', label: 'Next 6 Months' },
            { value: 'next_year', label: 'Next Year' },
        ];

        // useCallback to memoize the function, preventing unnecessary re-creation
        const generatePredictions = useCallback(async () => {
            if (loadingPredictions) return; // Prevent multiple clicks

            setLoadingPredictions(true);
            setError(null);

            try {
                const response = await fetch(
                    'http://localhost:8000/api/ai_predictions.php',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            prediction_type: predictionType,
                            period: predictionPeriod,
                        }),
                    }
                );

                const data = await response.json();

                if (data.success) {
                    setPredictiveData(data.predictions);
                } else {
                    setError(data.message || 'Failed to generate predictions');
                }
            } catch (err) {
                setError('Error generating predictions');
                console.error('Prediction Error:', err);
            } finally {
                setLoadingPredictions(false);
            }
        }, [predictionType, predictionPeriod, loadingPredictions, setPredictiveData, setError]); // Dependencies

        return (
            <div className='space-y-6'>
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                    <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                        <TrendingUp className='w-5 h-5 mr-2' />
                        Predictive Analysis
                    </h3>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>
                                Prediction Type
                            </label>
                            <select
                                value={predictionType}
                                onChange={(e) => setPredictionType(e.target.value)}
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'>
                                {predictionTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>
                                Prediction Period
                            </label>
                            <select
                                value={predictionPeriod}
                                onChange={(e) => setPredictionPeriod(e.target.value)}
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'>
                                {predictionPeriods.map((period) => (
                                    <option key={period.value} value={period.value}>
                                        {period.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={generatePredictions}
                        disabled={loadingPredictions}
                        className='flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50'>
                        {loadingPredictions ? (
                            <>
                                <Loader className='w-4 h-4 mr-2 animate-spin' />
                                Generating Predictions...
                            </>
                        ) : (
                            <>
                                <Brain className='w-4 h-4 mr-2' />
                                Generate Predictions
                            </>
                        )}
                    </button>
                </div>

                {predictiveData && (
                    <div className='space-y-6'>
                        {/* Prediction Chart */}
                        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                            <h4 className='text-lg font-semibold text-gray-900 mb-4'>
                                {predictiveData.title}
                            </h4>
                            <ResponsiveContainer width='100%' height={400}>
                                <LineChart data={predictiveData.chart_data}>
                                    <CartesianGrid strokeDasharray='3 3' />
                                    <XAxis dataKey='period' />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type='monotone'
                                        dataKey='actual'
                                        stroke='#8884d8'
                                        strokeWidth={2}
                                        name='Historical Data'
                                    />
                                    <Line
                                        type='monotone'
                                        dataKey='predicted'
                                        stroke='#82ca9d'
                                        strokeWidth={2}
                                        strokeDasharray='5 5'
                                        name='Predicted'
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Prediction Summary */}
                        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                            <h4 className='text-lg font-semibold text-gray-900 mb-4'>
                                Prediction Summary
                            </h4>
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                {predictiveData.summary.map((item, index) => (
                                    <div
                                        key={index}
                                        className='bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg'>
                                        <h5 className='font-semibold text-gray-900'>
                                            {item.metric}
                                        </h5>
                                        <p className='text-2xl font-bold text-purple-600 mt-1'>
                                            {item.value}
                                        </p>
                                        <p className='text-sm text-gray-600 mt-2'>
                                            {item.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Risk Factors & Recommendations */}
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                                <h4 className='text-lg font-semibold text-gray-900 mb-4'>
                                    Risk Factors
                                </h4>
                                <div className='space-y-3'>
                                    {predictiveData.risk_factors.map((risk, index) => (
                                        <div key={index} className='flex items-start space-x-3'>
                                            <AlertCircle className='w-5 h-5 text-red-500 mt-0.5' />
                                            <div>
                                                <p className='font-medium text-gray-900'>
                                                    {risk.factor}
                                                </p>
                                                <p className='text-sm text-gray-600'>{risk.impact}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                                <h4 className='text-lg font-semibold text-gray-900 mb-4'>
                                    Recommendations
                                </h4>
                                <div className='space-y-3'>
                                    {predictiveData.recommendations.map((rec, index) => (
                                        <div key={index} className='flex items-start space-x-3'>
                                            <Sparkles className='w-5 h-5 text-green-500 mt-0.5' />
                                            <div>
                                                <p className='font-medium text-gray-900'>
                                                    {rec.action}
                                                </p>
                                                <p className='text-sm text-gray-600'>
                                                    {rec.expected_impact}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className='min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-sans antialiased text-gray-800'>
            {/* Tailwind CSS CDN - Ensure this is in your public/index.html head if not using PostCSS setup */}
            <script src="[https://cdn.tailwindcss.com](https://cdn.tailwindcss.com)"></script>

            {error && (
                <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6'>
                    <div className='flex items-center space-x-2'>
                        <AlertCircle className='w-5 h-5 text-red-500' />
                        <span className='text-red-700 font-medium'>{error}</span>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className='mt-2 text-red-600 hover:text-red-800 text-sm'>
                        Dismiss
                    </button>
                </div>
            )}

            {/* Header */}
            <div className='flex justify-between items-center mb-6'>
                <h2 className='text-2xl sm:text-3xl font-bold text-gray-900 flex items-center'>
                    <Brain className='w-7 h-7 sm:w-8 sm:h-8 mr-3 text-blue-700' />
                    AI Analytics & Insights
                </h2>
            </div>

            {/* Tab Navigation */}
            <div className='flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 shadow-sm overflow-x-auto'>
                {[
                    { key: 'reports', label: 'AI Reports', icon: FileText },
                    { key: 'analytics', label: 'Smart Analytics', icon: TrendingUp },
                    { key: 'predictions', label: 'Predictive Analysis', icon: Brain },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => {
                            setActiveTab(tab.key);
                            // Clear any previous error when switching tabs
                            setError(null);
                        }}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap
                            ${activeTab === tab.key
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                            }`}>
                        <tab.icon className='w-4 h-4 mr-2' />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'reports' && (
                <ReportGeneration
                    reportData={reportData}
                    setReportData={setReportData}
                    setError={setError}
                />
            )}
            {activeTab === 'analytics' && (
                <SmartAnalytics
                    analyticsData={analyticsData}
                    setAnalyticsData={setAnalyticsData}
                    setError={setError}
                />
            )}
            {activeTab === 'predictions' && (
                <PredictiveAnalysis
                    predictiveData={predictiveData}
                    setPredictiveData={setPredictiveData}
                    setError={setError}
                />
            )}
        </div>
    );
};

export default AIAnalytics;
