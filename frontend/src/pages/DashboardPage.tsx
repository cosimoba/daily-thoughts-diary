import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  ViewColumnsIcon, 
  Bars3Icon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import Dashboard from '../components/Dashboard';
import DashboardStats from '../components/DashboardStats';
import CalendarView from '../components/CalendarView';
import { Entry } from '../types';

type ViewMode = 'timeline' | 'compact';
type SidebarView = 'calendar' | 'stats';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [sidebarView, setSidebarView] = useState<SidebarView>('calendar');

  const handleViewEntry = (entry: Entry) => {
    navigate(`/entries/${entry.id}`);
  };

  const handleEditEntry = (entry: Entry) => {
    navigate(`/entries/${entry.id}/edit`);
  };

  const handleDeleteEntry = (entry: Entry) => {
    // This would typically open a confirmation modal
    // For now, we'll just log it
    console.log('Delete entry:', entry.id);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const clearDateFilter = () => {
    setSelectedDate(undefined);
  };

  const handleCreateEntry = () => {
    navigate('/entries/new');
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Welcome back! Here's what's happening with your thoughts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Timeline view"
            >
              <Bars3Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'compact'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Compact view"
            >
              <ViewColumnsIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Create entry button */}
          <button
            onClick={handleCreateEntry}
            className="btn btn-primary"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Entry
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mb-8">
        <DashboardStats />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Dashboard */}
        <div className="lg:col-span-3">
          {selectedDate && (
            <div className="mb-6 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Showing entries for {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              <button
                onClick={clearDateFilter}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium"
              >
                View all entries
              </button>
            </div>
          )}

          <Dashboard
            selectedDate={selectedDate}
            viewMode={viewMode}
            onViewEntry={handleViewEntry}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteEntry}
          />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Sidebar tabs */}
          <div className="flex lg:hidden bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setSidebarView('calendar')}
              className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-md transition-colors ${
                sidebarView === 'calendar'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <CalendarIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Calendar</span>
            </button>
          </div>

          {/* Calendar */}
          <div className={sidebarView === 'calendar' ? 'block' : 'hidden lg:block'}>
            <CalendarView
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              showEntryCounts={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}