import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, BarChart3, ClipboardCheck } from 'lucide-react';

export default function InstructorDashboardPage() {
  return <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12"><p className="text-xs font-bold uppercase tracking-widest text-brand-700">Instructor workspace</p><h1 className="mt-2 text-3xl font-extrabold">Teach, review, and improve</h1><p className="mt-2 text-sm text-slate-600">Manage your curriculum, assessments, learners, and course performance.</p><div className="mt-8 grid sm:grid-cols-3 gap-4"><Action icon={<BookOpen />} title="Your courses" text="Create courses and organize modules and lessons." link="/instructor/courses" label="Open course studio"/><Action icon={<ClipboardCheck />} title="Assessments" text="Create quizzes and assignments from a course workspace." link="/instructor/courses" label="Choose a course"/><Action icon={<BarChart3 />} title="Analytics" text="See actual enrollment, progress, and assessment performance." link="/instructor/analytics" label="View analytics"/></div></main>;
}
function Action({ icon, title, text, link, label }) { return <section className="rounded-2xl border border-slate-200 bg-white p-5"><span className="text-brand-700">{React.cloneElement(icon, { className: 'w-5 h-5' })}</span><h2 className="mt-4 font-bold">{title}</h2><p className="mt-2 min-h-10 text-sm text-slate-500">{text}</p><Link to={link} className="mt-4 inline-block text-sm font-bold text-brand-700">{label} →</Link></section>; }
