import React, { memo } from 'react'
import { Calendar, Megaphone, CheckSquare, Zap, TrendingUp, Clock, BarChart3 } from 'lucide-react'

// Enhanced Stat Card with better animations and design
export const EnhancedStatCard = memo(({ title, value, icon: Icon, color, trend, delay = 0 }) => (
  <div
    className="group relative overflow-hidden bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/70 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1 animate-fade-in"
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Animated background gradient */}
    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

    {/* Animated border */}
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-slate-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />

    <div className="relative flex items-center">
      <div className={`h-14 w-14 ${color.replace('from-', 'bg-').split(' ')[0]}/20 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={`h-7 w-7 ${color.replace('from-', 'text-').split(' ')[0].replace('500', '400')} group-hover:scale-110 transition-transform duration-300`} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-400 mb-1 group-hover:text-slate-300 transition-colors">{title}</p>
        <div className="flex items-center space-x-2">
          <p className="text-3xl font-bold text-white group-hover:text-slate-100 transition-colors">{value}</p>
          {trend && (
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium animate-pulse ${
              trend > 0 ? 'bg-green-500/20 text-green-400' :
              trend < 0 ? 'bg-red-500/20 text-red-400' :
              'bg-slate-500/20 text-slate-400'
            }`}>
              <TrendingUp className={`h-3 w-3 mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Subtle glow effect */}
    <div className={`absolute -top-10 -right-10 h-20 w-20 ${color.replace('from-', 'bg-').split(' ')[0]}/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
  </div>
))

// Enhanced Activity Item with better styling
export const EnhancedActivityItem = memo(({ activity, delay = 0 }) => (
  <div
    className="group flex items-center space-x-4 p-4 bg-slate-800/30 hover:bg-slate-700/40 border border-slate-700/30 hover:border-slate-600/50 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/10 animate-fade-in"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={`h-3 w-3 rounded-full transition-all duration-300 ${
      activity.type === 'schedule' ? 'bg-blue-400 group-hover:bg-blue-300' :
      activity.type === 'announcement' ? 'bg-yellow-400 group-hover:bg-yellow-300' :
      activity.type === 'task' ? 'bg-green-400 group-hover:bg-green-300' :
      'bg-purple-400 group-hover:bg-purple-300'
    } group-hover:scale-125`} />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-white group-hover:text-slate-100 transition-colors truncate">
        {activity.action}
      </p>
      <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors truncate">
        {activity.details}
      </p>
    </div>
    <div className="flex items-center text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
      <Clock className="h-3 w-3 mr-1" />
      {activity.time}
    </div>
  </div>
))

// Quick Action Button Component
export const QuickActionButton = memo(({ to, icon: Icon, title, description, color, delay = 0 }) => (
  <a
    href={to}
    className={`group relative overflow-hidden bg-gradient-to-br ${color} hover:shadow-xl hover:shadow-slate-900/20 p-6 rounded-2xl transition-all duration-500 hover:-translate-y-1 hover:scale-105 animate-fade-in`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Animated background overlay */}
    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

    <div className="relative flex items-center space-x-4">
      <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm text-white/80 group-hover:text-white transition-colors">{description}</p>
      </div>
      <div className="ml-auto">
        <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>

    {/* Corner decoration */}
    <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  </a>
))

// Add fade-in animation to CSS
const styles = `
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out forwards;
}
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.type = 'text/css'
  styleSheet.innerText = styles
  document.head.appendChild(styleSheet)
}
