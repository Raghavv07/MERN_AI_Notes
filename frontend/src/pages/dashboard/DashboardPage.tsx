import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Bookmark,
  CheckCircle,
  Clock,
  Flame,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { dashboardApi } from '../../api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingScreen,
} from '../../components/ui';
import { formatRelativeTime } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['study-progress'],
    queryFn: dashboardApi.getStudyProgress,
  });

  const { data: activity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: () => dashboardApi.getRecentActivity(5),
  });

  if (statsLoading || progressLoading) {
    return <LoadingScreen />;
  }

  const statCards = [
    {
      title: 'Total Notes',
      value: stats?.stats.totalNotes || 0,
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Bookmarked',
      value: stats?.stats.bookmarkedNotes || 0,
      icon: Bookmark,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Completed',
      value: stats?.stats.completedNotes || 0,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Study Streak',
      value: `${stats?.stats.studyStreak || 0} days`,
      icon: Flame,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
    >
      {/* Welcome Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.fullName?.split(' ')[0]}! 👋</h1>
          <p className="text-muted-foreground mt-1">Here's your learning progress overview</p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon
                      className={`w-6 h-6 bg-linear-to-r ${stat.color} bg-clip-text text-transparent`}
                      style={{
                        color: stat.color.includes('blue')
                          ? '#3b82f6'
                          : stat.color.includes('yellow')
                            ? '#eab308'
                            : stat.color.includes('green')
                              ? '#22c55e'
                              : '#f97316',
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Circle */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Overall Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="w-48 h-48">
                <CircularProgressbar
                  value={progress?.overview.overallProgress || 0}
                  text={`${progress?.overview.overallProgress || 0}%`}
                  styles={buildStyles({
                    textSize: '16px',
                    pathColor: '#3b82f6',
                    textColor: 'hsl(var(--foreground))',
                    trailColor: 'hsl(var(--muted))',
                    pathTransitionDuration: 1,
                  })}
                />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 w-full">
                <div className="text-center p-3 bg-green-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {progress?.overview.completedTopics || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">
                    {progress?.overview.pendingTopics || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                30 Days Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
                  <AreaChart data={progress?.dailyActivity || []}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="_id"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.slice(5)}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorCount)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notes by Exam Type */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Notes by Exam Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
                  <PieChart>
                    <Pie
                      data={stats?.breakdown.byExamType || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="_id"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {stats?.breakdown.byExamType?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notes by Class Level */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Notes by Class Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
                  <BarChart data={stats?.breakdown.byClassLevel || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Streak Card */}
        <motion.div variants={itemVariants}>
          <Card className="bg-linear-to-br from-orange-500/10 to-red-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Study Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="text-6xl font-bold text-orange-500"
                >
                  {progress?.studyStreak.current || 0}
                </motion.p>
                <p className="text-muted-foreground mt-2">Current Streak (days)</p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm">
                    Longest: {progress?.studyStreak.longest || 0} days
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activity?.recentlyAccessed?.slice(0, 4).map((note, index) => (
                  <div
                    key={`${note._id}-${index}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm font-medium truncate max-w-37.5">{note.topic}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(note.lastAccessedAt)}
                    </span>
                  </div>
                ))}
                {(!activity?.recentlyAccessed || activity.recentlyAccessed.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </motion.div>
  );
}
