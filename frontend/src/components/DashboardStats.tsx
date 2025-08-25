import { 
  DocumentTextIcon, 
  PencilSquareIcon, 
  FireIcon, 
  TagIcon,
  TrophyIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { FireIcon as FireSolidIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import { useStats, useWritingStreak, useDailyGoal } from '../hooks/useStats';
import { StatsCardSkeleton } from './ui/LoadingSkeleton';
import LoadingSpinner from './ui/LoadingSpinner';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  description?: string;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  className?: string;
  loading?: boolean;
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend, 
  className,
  loading 
}: StatCardProps) {
  if (loading) {
    return <StatsCardSkeleton />;
  }

  return (
    <div className={clsx('card p-6', className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {title}
            </h3>
          </div>
          
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          
          {description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
          
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span className={clsx(
                'text-xs font-medium',
                trend.positive 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              )}>
                {trend.positive ? '↗' : '↘'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {trend.label}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  loading?: boolean;
}

function StreakCard({ currentStreak, longestStreak, loading }: StreakCardProps) {
  if (loading) {
    return <StatsCardSkeleton />;
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {currentStreak > 0 ? (
              <FireSolidIcon className="h-5 w-5 text-orange-500" />
            ) : (
              <FireIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            )}
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Writing Streak
            </h3>
          </div>
          
          <div className="mt-2 flex items-baseline gap-3">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {currentStreak}
            </p>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              days
            </span>
          </div>
          
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Best: {longestStreak} days
          </p>
          
          {currentStreak > 0 && (
            <div className="mt-2 flex items-center gap-1">
              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                🔥 Keep it up!
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface DailyGoalCardProps {
  todayWordCount: number;
  goalWordCount: number;
  percentage: number;
  loading?: boolean;
}

function DailyGoalCard({ todayWordCount, goalWordCount, percentage, loading }: DailyGoalCardProps) {
  if (loading) {
    return <StatsCardSkeleton />;
  }

  const isGoalMet = percentage >= 100;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <TrophyIcon className={clsx(
              'h-5 w-5',
              isGoalMet 
                ? 'text-yellow-500' 
                : 'text-gray-400 dark:text-gray-500'
            )} />
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Daily Goal
            </h3>
          </div>
          
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {todayWordCount}
            </p>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              / {goalWordCount} words
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={clsx(
                'h-2 rounded-full transition-all duration-300',
                isGoalMet
                  ? 'bg-green-500'
                  : 'bg-primary-500'
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {Math.round(percentage)}% complete
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardStats() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: streak, isLoading: streakLoading } = useWritingStreak();
  const { data: dailyGoal, isLoading: goalLoading } = useDailyGoal();

  if (statsLoading && streakLoading && goalLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <StatsCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Entries"
          value={stats?.totalEntries || 0}
          icon={DocumentTextIcon}
          description="All time"
          loading={statsLoading}
        />
        
        <StatCard
          title="Words Written"
          value={stats?.totalWords || 0}
          icon={PencilSquareIcon}
          description={`Avg ${Math.round(stats?.averageWordsPerEntry || 0)} per entry`}
          loading={statsLoading}
        />
        
        {streak && (
          <StreakCard
            currentStreak={streak.currentStreak}
            longestStreak={streak.longestStreak}
            loading={streakLoading}
          />
        )}
        
        <StatCard
          title="Unique Tags"
          value={stats?.tagDistribution?.length || 0}
          icon={TagIcon}
          description="Categories used"
          loading={statsLoading}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dailyGoal && (
          <DailyGoalCard
            todayWordCount={dailyGoal.todayWordCount}
            goalWordCount={dailyGoal.goalWordCount}
            percentage={dailyGoal.percentage}
            loading={goalLoading}
          />
        )}
        
        <StatCard
          title="This Month"
          value={stats?.entriesByMonth?.[0]?.count || 0}
          icon={CalendarIcon}
          description="entries written"
          loading={statsLoading}
        />
      </div>

      {/* Most Used Tags */}
      {stats?.tagDistribution && stats.tagDistribution.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Most Used Tags
          </h3>
          
          <div className="flex flex-wrap gap-2">
            {stats.tagDistribution.slice(0, 10).map((tagStat, index) => (
              <span
                key={tagStat.tag}
                className={clsx(
                  'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
                  index === 0 && 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200',
                  index === 1 && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                  index === 2 && 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
                  index > 2 && 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                )}
              >
                <TagIcon className="h-3 w-3" />
                {tagStat.tag}
                <span className="ml-1 text-xs opacity-75">
                  {tagStat.count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}