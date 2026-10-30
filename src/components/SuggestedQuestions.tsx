import React, { useState } from 'react';
import {
  Clock,
  CreditCard,
  BookOpen,
  Wifi,
  Home,
  Award,
  Calendar,
  Briefcase,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Layers,
  MapPin,
  Utensils,
  Bus,
} from 'lucide-react';

interface SuggestedQuestionsProps {
  onSelectQuestion: (question: string) => void;
}

interface QuestionCard {
  category: string;
  tag: string;
  question: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  borderColor: string;
  badgeBg: string;
}

const ALL_QUESTIONS: QuestionCard[] = [
  {
    category: 'Timings',
    tag: 'Class Timings',
    question: 'What are the regular class timings?',
    description: 'Lecture schedule, 50-minute periods, and daily lunch break timing',
    icon: Clock,
    gradient: 'from-blue-600 to-indigo-600',
    borderColor: 'hover:border-blue-400',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    category: 'Fees',
    tag: 'Fees & Payment',
    question: 'What is the last date to pay semester fees?',
    description: 'Semester deadlines (Aug 15 / Jan 15) and instalment requests',
    icon: CreditCard,
    gradient: 'from-emerald-600 to-teal-600',
    borderColor: 'hover:border-emerald-400',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    category: 'Library',
    tag: 'Library Services',
    question: 'What are the library hours and book limits?',
    description: 'Mon–Sat hours, exam late nights, and UG/PG book borrowing limits',
    icon: BookOpen,
    gradient: 'from-amber-600 to-orange-600',
    borderColor: 'hover:border-amber-400',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    category: 'Campus',
    tag: 'Campus Wi-Fi',
    question: 'How do I connect to the campus Wi-Fi?',
    description: 'Connecting to CampusNet using your roll number and default credentials',
    icon: Wifi,
    gradient: 'from-cyan-600 to-blue-600',
    borderColor: 'hover:border-cyan-400',
    badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
  {
    category: 'Hostel',
    tag: 'Hostel & Curfew',
    question: 'What are the hostel gate timings?',
    description: 'Curfew for 1st-year (9:30 PM) and senior students (10:30 PM)',
    icon: Home,
    gradient: 'from-purple-600 to-indigo-600',
    borderColor: 'hover:border-purple-400',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    category: 'Exams',
    tag: 'Exams & Attendance',
    question: 'What is the minimum attendance required for exams?',
    description: '75% attendance rule, eligibility, and detention criteria',
    icon: Award,
    gradient: 'from-rose-600 to-pink-600',
    borderColor: 'hover:border-rose-400',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    category: 'Placements',
    tag: 'Placement Cell',
    question: 'When does the placement season start?',
    description: 'Campus drives, eligibility, and portal registration deadlines',
    icon: Briefcase,
    gradient: 'from-indigo-600 to-violet-600',
    borderColor: 'hover:border-indigo-400',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    category: 'Campus',
    tag: 'Transport & Buses',
    question: 'Does Anand-ICE have bus service in Jaipur?',
    description: 'City bus routes, route passes, and Transport Office details',
    icon: Bus,
    gradient: 'from-teal-600 to-emerald-600',
    borderColor: 'hover:border-teal-400',
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
  },
];

const CATEGORY_TABS = [
  'All Topics',
  'Timings',
  'Fees',
  'Library',
  'Hostel',
  'Exams',
  'Campus',
];

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  onSelectQuestion,
}) => {
  const [activeTab, setActiveTab] = useState('All Topics');

  const filteredQuestions =
    activeTab === 'All Topics'
      ? ALL_QUESTIONS
      : ALL_QUESTIONS.filter((q) => q.category === activeTab);

  return (
    <div className="flex flex-col items-center justify-center py-6 sm:py-10 px-4 max-w-5xl mx-auto text-center animate-fadeIn">
      {/* College Identity Pill */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/90 text-blue-900 text-xs font-semibold mb-4 shadow-2xs">
        <GraduationCap className="w-4 h-4 text-blue-700" />
        <span>Anand International College of Engineering • Anand-ICE Jaipur</span>
      </div>

      {/* Hero Headings */}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2.5 sm:mb-3">
        Your College Questions,{' '}
        <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-500 bg-clip-text text-transparent">
          Answered Instantly.
        </span>
      </h2>

      <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto mb-7 sm:mb-8 leading-relaxed">
        Ask anything regarding class schedules, fee deadlines, hostel rules, library hours,
        scholarships, exams, transport, or Wi-Fi in <strong className="text-slate-800 font-semibold">English, Hindi (हिन्दी)</strong>, or <strong className="text-slate-800 font-semibold">Hinglish</strong>.
      </p>

      {/* Interactive Category Filter Pills */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-6 sm:mb-8 flex-wrap">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/25 scale-102'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Suggested Questions Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 text-left">
        {filteredQuestions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectQuestion(item.question)}
              className={`group p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between text-left hover:-translate-y-1 ${item.borderColor}`}
            >
              <div>
                {/* Card Header with Icon & Category */}
                <div className="flex items-center justify-between mb-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${item.gradient} text-white flex items-center justify-center shadow-xs shadow-slate-300 group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeBg} uppercase tracking-wider`}
                  >
                    {item.tag}
                  </span>
                </div>

                {/* Card Title */}
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors leading-snug mb-1.5">
                  "{item.question}"
                </h3>

                {/* Card Helper text */}
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Action hint footer */}
              <div className="mt-3.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-blue-600 group-hover:text-blue-700">
                <span>Ask bot</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
