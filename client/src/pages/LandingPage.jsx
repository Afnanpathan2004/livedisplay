import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Monitor,
  Calendar,
  Megaphone,
  CheckSquare,
  Users,
  Shield,
  Zap,
  BarChart3,
  ArrowRight,
  Star,
  Globe,
  Clock,
  Sparkles,
  Rocket,
  Target,
  TrendingUp,
  Play
} from 'lucide-react';

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: Monitor,
      title: "Digital Display Management",
      description: "Manage multiple digital displays with real-time content updates and intelligent scheduling",
      gradient: "from-blue-500 to-cyan-500",
      delay: 100
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Advanced AI-powered scheduling with conflict resolution and automated notifications",
      gradient: "from-green-500 to-emerald-500",
      delay: 200
    },
    {
      icon: Megaphone,
      title: "Dynamic Announcements",
      description: "Broadcast critical messages with priority levels, multimedia support, and smart targeting",
      gradient: "from-purple-500 to-pink-500",
      delay: 300
    },
    {
      icon: CheckSquare,
      title: "Intelligent Task Management",
      description: "AI-driven task assignment with progress tracking, deadline management, and collaboration tools",
      gradient: "from-orange-500 to-red-500",
      delay: 400
    },
    {
      icon: Users,
      title: "Advanced User Management",
      description: "Enterprise-grade access control with SSO, multi-factor authentication, and detailed analytics",
      gradient: "from-indigo-500 to-purple-500",
      delay: 500
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Comprehensive dashboards with predictive insights, custom reports, and automated alerts",
      gradient: "from-teal-500 to-green-500",
      delay: 600
    }
  ];

  const stats = [
    { label: "Active Displays", value: "500+", icon: Monitor },
    { label: "Daily Schedules", value: "10K+", icon: Calendar },
    { label: "Team Members", value: "2.5K+", icon: Users },
    { label: "Uptime", value: "99.9%", icon: Zap }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary gradient orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>

        {/* Floating particles */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-300"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-cyan-400 rounded-full animate-bounce delay-700"></div>
        <div className="absolute bottom-32 left-1/3 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-500"></div>
        <div className="absolute top-1/3 right-20 w-1 h-1 bg-pink-400 rounded-full animate-bounce delay-1000"></div>
      </div>

      {/* Navigation */}
      <nav className={`relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Monitor className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
                LiveBoard Pro
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-slate-300 hover:text-white font-medium transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`relative z-10 px-4 sm:px-6 lg:px-8 pt-20 pb-32 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm font-medium text-blue-400 mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              Next-Generation Digital Display Management
            </div>
            <h1 className="text-6xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
                Transform Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                Digital Workspace
              </span>
            </h1>
            <p className="text-xl text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              Revolutionize your organization's communication with AI-powered digital displays,
              intelligent scheduling, and enterprise-grade management tools. Experience the future of workplace efficiency.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              to="/register"
              className="group bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:from-blue-700 hover:via-cyan-700 hover:to-blue-700 text-white font-bold px-8 py-4 rounded-2xl transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 animate-gradient-x"
            >
              <div className="flex items-center justify-center space-x-3">
                <Rocket className="w-6 h-6" />
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              to="#demo"
              className="group flex items-center space-x-3 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm border border-slate-700/50 hover:border-slate-600/50 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300 hover:shadow-lg"
            >
              <Play className="w-5 h-5" />
              <span>Watch Demo</span>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={stat.label} className={`text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: `${800 + index * 100}ms` }}>
                <div className="flex justify-center mb-3">
                  <div className="h-12 w-12 bg-slate-800/50 rounded-xl flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-slate-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 py-32 bg-slate-900/20">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Powerful Features for
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"> Modern Teams</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Everything you need to manage digital displays, coordinate schedules, and keep your team informed with cutting-edge technology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`group bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 hover:border-slate-600/70 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-2 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${feature.delay}ms` }}
              >
                {/* Animated background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl`} />

                <div className="relative">
                  <div className={`inline-flex h-16 w-16 bg-gradient-to-br ${feature.gradient} rounded-2xl items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-4 group-hover:text-slate-100 transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Hover effect line */}
                  <div className={`h-1 bg-gradient-to-r ${feature.gradient} rounded-full mt-6 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`relative z-10 px-4 sm:px-6 lg:px-8 py-32 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-12 shadow-2xl">
            <div className="mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-sm font-medium text-green-400 mb-6">
                <TrendingUp className="w-4 h-4 mr-2" />
                Join 10,000+ Organizations Worldwide
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Transform Your
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"> Digital Workspace?</span>
              </h2>
              <p className="text-xl text-slate-400 mb-8">
                Start your free trial today and experience the power of intelligent digital display management.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-green-500/25"
              >
                Start Free Trial
              </Link>
              <Link
                to="/login"
                className="bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm border border-slate-700/50 hover:border-slate-600/50 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300 hover:shadow-lg"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 sm:px-6 lg:px-8 py-12 bg-slate-950/50 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Monitor className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">LiveBoard Pro</span>
          </div>
          <p className="text-slate-400 text-sm">
            © 2024 LiveBoard Pro. All rights reserved. Built with ❤️ for modern teams.
          </p>
        </div>
      </footer>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 2s ease infinite;
        }
      `}</style>
    </div>
  )
}
