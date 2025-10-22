'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Calendar,
  Compass,
  Layers,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react'

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

  const featureCards = [
    {
      icon: Sparkles,
      title: 'Prompt intelligence',
      description: 'Blend hand-crafted prompts with AI suggestions to cover every angle of your brand.',
    },
    {
      icon: BarChart3,
      title: 'Score transparency',
      description: 'Explore the five-brand dimensions with clear reasoning, metrics, and drill-ins.',
    },
    {
      icon: ShieldCheck,
      title: 'Enterprise ready',
      description: 'Role-based access, audit-ready exports, and privacy-first architecture out of the box.',
    },
    {
      icon: Zap,
      title: 'Launch in seconds',
      description: 'Spin up a new analysis workflow in under a minute—no implementation backlog required.',
    },
  ]

  const workflowSteps = [
    {
      step: '01',
      title: 'Connect your brand',
      description: 'Add domains and brand guidelines so the models understand your tone and guardrails.',
      icon: Layers,
    },
    {
      step: '02',
      title: 'Craft the question set',
      description: 'Combine your strategic prompts with AI-generated suggestions to ensure full coverage.',
      icon: Compass,
    },
    {
      step: '03',
      title: 'Run continuous analyses',
      description: 'Trigger on-demand or schedule automations to monitor sentiment and visibility changes.',
      icon: Calendar,
    },
  ]

  const outcomeHighlights = [
    {
      metric: '92%',
      label: 'Visibility score',
      description: 'Average share of voice our customers sustain after 30 days on the platform.',
    },
    {
      metric: '14s',
      label: 'Time to insight',
      description: 'Median duration from trigger to completed multi-model analysis.',
    },
    {
      metric: '5x',
      label: 'Faster decisions',
      description: 'Teams see tangible momentum by consolidating playbooks and insights in one place.',
    },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 h-72 w-72 rounded-full bg-purple-500/40 blur-3xl mix-blend-screen animate-blob" />
        <div className="absolute top-10 -right-10 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl mix-blend-screen animate-blob animation-delay-2000" />
        <div className="absolute bottom-10 left-1/4 h-96 w-96 rounded-full bg-slate-500/20 blur-3xl mix-blend-screen animate-blob animation-delay-4000" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.08),_transparent_65%)]" />
      </div>

      <div className="relative flex min-h-screen flex-col">
        <header className="mx-auto w-full max-w-6xl px-6 pt-10">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">AI Visibility</p>
                <p className="text-sm font-medium text-slate-200">Own the narrative in generative search</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-white/30 hover:text-white"
              >
                Sign in
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100">
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <motion.main
          className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-20 px-6 pb-24 pt-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <section className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <motion.div variants={itemVariants} className="space-y-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/80">
                Live brand intelligence
              </div>
              <div className="space-y-6">
                <h1 className="text-4xl font-semibold leading-tight text-white sm:text-6xl sm:leading-[1.1]">
                  Shape how AI describes your brand, every single day.
                </h1>
                <p className="text-lg text-slate-300 sm:text-xl">
                  Monitor, benchmark, and improve your generative visibility across models like ChatGPT, Gemini, and
                  Perplexity. Run deep analyses in seconds and act on opportunities before competitors even notice them.
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link href="/register">
                  <Button size="xl" className="group bg-white text-slate-900 hover:bg-slate-100">
                    Start free analysis
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/projects">
                  <Button
                    size="xl"
                    variant="outline"
                    className="border-white/20 bg-white/5 text-white backdrop-blur-xl hover:border-white/40 hover:bg-white/10"
                  >
                    View sample workspace
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: Target, label: 'Score every dimension in minutes' },
                  { icon: TrendingUp, label: 'Spot sentiment swings instantly' },
                  { icon: Activity, label: 'Automate daily competitive audits' },
                ].map((item) => (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200"
                  >
                    <item.icon className="h-4 w-4 text-amber-300" />
                    {item.label}
                  </span>
                ))}
              </div>
            </motion.div>

            <div className="grid gap-6">
              <motion.div
                variants={itemVariants}
                className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-[0_20px_60px_-25px_rgba(59,130,246,0.55)] backdrop-blur-2xl"
              >
                <motion.div animate={floatingAnimation}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-200/70">Latest run summary</p>
                      <p className="text-3xl font-semibold text-white">92.4 visibility</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">
                    {[
                      { label: 'Sentiment', value: '+18.2% MoM', tone: 'positive' },
                      { label: 'Mentions captured', value: '1,240 → 1,680', tone: 'neutral' },
                      { label: 'Avg position', value: '#2.1 across prompts', tone: 'positive' },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-200">{row.label}</p>
                        <span
                          className={`text-sm font-semibold ${
                            row.tone === 'positive'
                              ? 'text-emerald-300'
                              : row.tone === 'negative'
                                ? 'text-rose-300'
                                : 'text-slate-300'
                          }`}
                        >
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl sm:grid-cols-2"
              >
                {[
                  {
                    title: 'Real-time alerts',
                    description: 'Get notified when sentiment dips or a competitor outranks you on key prompts.',
                  },
                  {
                    title: 'Data you can action',
                    description: 'Export insights to your GTM workflows or sync with dashboards instantly.',
                  },
                ].map((card) => (
                  <div key={card.title} className="rounded-2xl border border-white/5 bg-white/5 p-5 text-slate-200">
                    <p className="text-sm font-semibold text-white">{card.title}</p>
                    <p className="mt-2 text-xs text-slate-300">{card.description}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </section>

          <motion.section variants={itemVariants} className="space-y-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200">
                  Why teams choose us
                </span>
                <h2 className="text-3xl font-semibold text-white sm:text-4xl">All the signal, none of the noise.</h2>
                <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
                  Make sense of generative answers across search models. Consolidate prompts, runs, and competitor
                  benchmarks in a single workspace the entire team can use.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                SOC2-ready
                <span className="inline-flex h-2 w-2 rounded-full bg-sky-400" />
                GDPR-compliant
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {featureCards.map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  whileHover={{ y: -6, scale: 1.01 }}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl transition"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative flex h-full flex-col gap-4">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg">
                      <feature.icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-300">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200">
                Built for ship-fast teams
              </span>
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">Operationalize AI visibility in three steps.</h2>
              <p className="text-sm text-slate-300 sm:text-base">
                Launch a workflow that keeps marketing, growth, and leadership aligned on how AI describes the brand. No
                engineering tickets, no manual spreadsheet updates.
              </p>
              <div className="space-y-4">
                {workflowSteps.map((step) => (
                  <div
                    key={step.title}
                    className="flex gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:border-white/30"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">{step.step}</span>
                        <span className="text-sm font-medium text-slate-300">Guided setup</span>
                      </div>
                      <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                      <p className="text-sm text-slate-300">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 backdrop-blur-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-200/70">Playbook velocity</p>
                    <p className="text-3xl font-semibold text-white">5x faster</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                    <Layers className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-6 text-sm text-slate-300">
                  Teams replace scattered documents with a single, version-controlled analysis library. Every run is archived,
                  searchable, and ready to export.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-200/70">Trusted by growth leaders</p>
                <p className="mt-3 text-lg text-slate-200">
                  “We finally understand how AI agents talk about our product. The daily runs surface opportunities before they
                  hit social or sales calls.”
                </p>
                <div className="mt-4 text-sm text-slate-400">
                  <span className="font-semibold text-white">Nora Patel</span> · VP Growth, LumenIQ
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="space-y-10">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200">
                  Outcomes our teams achieve
                </span>
                <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Quantify the lift from day one.</h2>
              </div>
              <Link href="/register">
                <Button
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white backdrop-blur-xl hover:border-white/40 hover:bg-white/10"
                >
                  Join the waitlist
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {outcomeHighlights.map((highlight) => (
                <div
                  key={highlight.label}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-200 backdrop-blur-2xl"
                >
                  <p className="text-4xl font-semibold text-white">{highlight.metric}</p>
                  <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-slate-400">{highlight.label}</p>
                  <p className="mt-4 text-sm text-slate-300">{highlight.description}</p>
                </div>
              ))}
            </div>
          </motion.section>
        </motion.main>

        <footer className="border-t border-white/10 bg-white/5 backdrop-blur-2xl">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-center text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} AI Visibility. Crafted for modern growth teams.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/login" className="hover:text-white">
                Sign in
              </Link>
              <span className="text-white/20">•</span>
              <Link href="/register" className="hover:text-white">
                Create account
              </Link>
              <span className="text-white/20">•</span>
              <span>Privacy-first & secure</span>
            </div>
          </div>
        </footer>
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
          0%,
          100% {
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
