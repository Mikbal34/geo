'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, BarChart3, Zap, ArrowRight, Target, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      setIsLoggedIn(true)
      // Redirect to projects if logged in
      router.push('/projects')
    } else {
      setLoading(false)
    }
  }, [router])

  if (loading || isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-slate-900 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
      },
    },
  }

  const floatingAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-slate-700 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-slate-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-slate-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-20">
        <motion.div
          className="max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20">
              <Sparkles className="w-4 h-4 text-slate-300" />
              <span className="text-sm font-semibold text-slate-200">
                Powered by GPT-4 Turbo
              </span>
            </div>
          </motion.div>

          {/* Hero Title */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h1 className="text-6xl md:text-8xl font-black text-white mb-6 leading-[1.1] tracking-tight">
              Decode Your
              <span className="block mt-2 text-slate-300">
                Brand DNA
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-light">
              AI-powered insights that transform your brand strategy. Analyze 6 critical dimensions in under 15 seconds.
            </p>
          </motion.div>

          {/* CTA Button */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link href="/register">
              <Button size="xl" className="group">
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="xl" variant="outline" className="bg-white/5 backdrop-blur-xl border-white/20 text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
          </motion.div>

          {/* Features Grid */}
          <motion.div variants={containerVariants} className="grid md:grid-cols-3 gap-6 mb-20">
            {[
              {
                icon: Sparkles,
                title: 'AI-Powered',
                description: 'GPT-4 Turbo analyzes your brand with human-like understanding',
                gradient: 'from-slate-700 to-slate-600',
              },
              {
                icon: BarChart3,
                title: '6 Dimensions',
                description: 'Comprehensive analysis across all critical brand metrics',
                gradient: 'from-slate-600 to-slate-500',
              },
              {
                icon: Zap,
                title: 'Lightning Fast',
                description: 'Get actionable insights in under 15 seconds',
                gradient: 'from-slate-500 to-slate-400',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -8, transition: { type: 'spring', stiffness: 300 } }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-slate-700 to-slate-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative h-full bg-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 group-hover:border-white/20 transition-all">
                  <motion.div
                    animate={floatingAnimation}
                    className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                  >
                    <feature.icon className="w-7 h-7 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={itemVariants}
            className="bg-white/5 backdrop-blur-2xl rounded-3xl p-8 md:p-12 border border-white/10"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { value: '100%', label: 'AI Accuracy', icon: Target, color: 'from-slate-300 to-slate-400' },
                { value: '<15s', label: 'Analysis Time', icon: Zap, color: 'from-slate-300 to-slate-400' },
                { value: '6', label: 'Dimensions', icon: TrendingUp, color: 'from-slate-300 to-slate-400' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <stat.icon className="w-8 h-8 text-slate-300" />
                    <motion.div
                      className="text-5xl font-black text-slate-200"
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
                    >
                      {stat.value}
                    </motion.div>
                  </div>
                  <div className="text-slate-400 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  )
}
