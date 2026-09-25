import React from 'react';
import StatusCard from '../components/common/StatusCard';
import {
  Sparkles,
  BookOpen,
  Users,
  Award,
  BrainCircuit,
  FileCheck,
  CheckCircle,
  ArrowRight,
  Shield,
  Layers,
  BarChart3,
  Clock
} from 'lucide-react';

export default function HomePage() {
  const roles = [
    {
      title: 'Platform Admin',
      desc: 'Complete governance, category management, policy enforcement, user access, and system analytics.',
      badge: 'Admin',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      title: 'Course Instructor',
      desc: 'Build courses, modules, lessons, randomized question quizzes, assignments, and evaluate learners.',
      badge: 'Creator',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      title: 'Content Reviewer',
      desc: 'Strict peer verification: inspect course content, approve, reject, or request changes before publishing.',
      badge: 'Quality Control',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      title: 'Student Learner',
      desc: 'Personalized AI learning paths, interactive lessons, self-assessments, weak concept remediation, certificates.',
      badge: 'Learner',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: 'Academic Mentor',
      desc: 'Track student progress, diagnose bottlenecks, host 1-on-1 feedback sessions, and guide learning journeys.',
      badge: 'Guide',
      color: 'bg-sky-50 text-sky-700 border-sky-200',
    },
  ];

  const uniqueInnovations = [
    {
      icon: <BrainCircuit className="w-6 h-6 text-brand-600" />,
      title: 'AI Weak Concept Remediation',
      desc: 'Unlike traditional platforms that just show scores, LearnHub diagnoses exact concept deficiencies and synthesizes targeted revision drills.',
    },
    {
      icon: <FileCheck className="w-6 h-6 text-indigo-600" />,
      title: 'Peer Quality Review Workflow',
      desc: 'Guarantees academic rigor through an institutional review pipeline: Draft → Submitted → Review → Approved → Published.',
    },
    {
      icon: <Users className="w-6 h-6 text-emerald-600" />,
      title: 'Dedicated Mentor Interventions',
      desc: 'Active mentorship bridge connecting struggling learners directly to guidance mentors based on live assessment metrics.',
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-amber-600" />,
      title: 'Granular Assessment Analytics',
      desc: 'Comprehensive multi-level tracking measuring lesson completion, assignment rubrics, and quiz attempt histories.',
    },
  ];

  const modulesProgress = [
    { number: '01', title: 'Project Foundation & Setup', status: 'Completed', current: true },
    { number: '02', title: 'Auth & Role-Based Authorization', status: 'Next Up', current: false },
    { number: '03', title: 'Course & Curriculum Management', status: 'Pending', current: false },
    { number: '04', title: 'Course Review & Approval Workflow', status: 'Pending', current: false },
    { number: '05', title: 'Course Discovery & Enrollment', status: 'Pending', current: false },
    { number: '06', title: 'Interactive Quiz System', status: 'Pending', current: false },
    { number: '07', title: 'Assignment Submission & Grading', status: 'Pending', current: false },
    { number: '08', title: 'Progress Tracking & Certificates', status: 'Pending', current: false },
    { number: '09', title: 'Mentor System & Guidance', status: 'Pending', current: false },
    { number: '10', title: 'AI Personalized Learning Paths', status: 'Pending', current: false },
    { number: '11', title: 'Instructor Analytics & Notifications', status: 'Pending', current: false },
    { number: '12', title: 'Final Polish, Testing & Deployment', status: 'Pending', current: false },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/70 via-white to-slate-50 border-b border-slate-200 pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-brand-200 text-brand-700 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Next-Generation MERN E-Learning Architecture</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Skill Learning & <br />
              <span className="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">
                Assessment Platform
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              LearnHub bridges the gap between passive video watching and real mastery with an AI-driven learning engine, rigorous multi-role course review workflows, and integrated mentorship.
            </p>
          </div>

          {/* Real-time System Status Card */}
          <div className="mt-12 max-w-4xl mx-auto">
            <StatusCard />
          </div>
        </div>
      </section>

      {/* Unique Platform Features vs Generic Platforms */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Why LearnHub Stands Apart</span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Built Beyond Traditional Learning Portals
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Combining the accessibility of Udemy and the academic rigor of NPTEL with next-generation AI intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {uniqueInnovations.map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Five User Roles Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Governance & Roles</span>
            <h2 className="text-3xl font-extrabold tracking-tight mt-1">Multi-Role Specialized Ecosystem</h2>
            <p className="text-sm text-slate-400 mt-2">
              Every participant operates within a tailored workflow tailored to their responsibilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role, idx) => (
              <div
                key={idx}
                className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-base text-white">{role.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${role.color}`}>
                    {role.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{role.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module 1 Foundation Architecture Roadmap */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 mb-6 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Phased Implementation</span>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                Modular Build Roadmap
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Each module builds upon the rock-solid foundation created in Module 1.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800">
                <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Module 1 Complete
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modulesProgress.map((m) => (
              <div
                key={m.number}
                className={`p-4 rounded-xl border transition-all ${
                  m.current
                    ? 'border-emerald-300 bg-emerald-50/50 shadow-sm'
                    : m.status === 'Next Up'
                    ? 'border-brand-300 bg-brand-50/30'
                    : 'border-slate-200 bg-slate-50/40 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold text-slate-400">MODULE {m.number}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      m.current
                        ? 'bg-emerald-100 text-emerald-800'
                        : m.status === 'Next Up'
                        ? 'bg-brand-100 text-brand-800'
                        : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-800">{m.title}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
