import React from 'react';
import { BookOpen, Shield, Code, Cpu } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center space-x-2 text-white">
              <BookOpen className="w-5 h-5 text-brand-400" />
              <span className="text-lg font-bold">LearnHub</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              A comprehensive MERN-based Skill Learning & Assessment Platform designed with AI-driven personalized learning paths, weak concept detection, instructor workflows, and multi-role governance.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> 5 User Roles</span>
              <span className="flex items-center gap-1"><Code className="w-3.5 h-3.5" /> MERN Stack</span>
              <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5" /> AI Enabled</span>
            </div>
          </div>

          {/* User Roles */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Roles Supported</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>• Platform Admin</li>
              <li>• Instructor</li>
              <li>• Content Reviewer</li>
              <li>• Student Learner</li>
              <li>• Mentor</li>
            </ul>
          </div>

          {/* Roadmap */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Current Status</h4>
            <p className="text-xs text-slate-400 mb-2">
              <span className="text-emerald-400 font-medium">Module 1 Completed:</span> Project Foundation & Initial Setup
            </p>
            <p className="text-xs text-slate-500">
              <span className="text-brand-400 font-medium">Next:</span> Module 2 – Authentication & Role-Based Authorization
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} LearnHub. Capstone Project – All Rights Reserved.</p>
          <p className="mt-2 sm:mt-0">React • Express • MongoDB • Node.js • Tailwind CSS</p>
        </div>
      </div>
    </footer>
  );
}
