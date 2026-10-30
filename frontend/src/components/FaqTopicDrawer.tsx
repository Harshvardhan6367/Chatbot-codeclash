import React, { useState } from 'react';
import { X, Search, BookOpen, ExternalLink, GraduationCap } from 'lucide-react';
import { FaqTopic } from '../types';

interface FaqTopicDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  topics: FaqTopic[];
  onSelectQuestion: (question: string) => void;
}

export const FaqTopicDrawer: React.FC<FaqTopicDrawerProps> = ({
  isOpen,
  onClose,
  topics,
  onSelectQuestion,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredTopics = topics.filter((t) =>
    t.category.toLowerCase().includes(search.toLowerCase()) ||
    t.sampleQuestions.some((q) => q.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-slideLeft">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Browse College FAQs</h3>
              <p className="text-xs text-slate-500">Official Anand-ICE Jaipur institutional database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter topics or questions..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredTopics.map((topic) => {
            const isExpanded = selectedCategory === topic.category || Boolean(search);
            return (
              <div
                key={topic.category}
                className="rounded-2xl border border-slate-200/90 overflow-hidden bg-white shadow-xs"
              >
                <button
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === topic.category ? null : topic.category
                    )
                  }
                  className="w-full p-3.5 bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between transition-colors text-left"
                >
                  <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                    {topic.category}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                    {topic.count} questions
                  </span>
                </button>

                {isExpanded && (
                  <div className="p-3 space-y-2 divide-y divide-slate-100 text-xs">
                    {topic.sampleQuestions.map((question, qIdx) => (
                      <div
                        key={qIdx}
                        className="pt-2 first:pt-0 flex items-start justify-between gap-2 group"
                      >
                        <p className="text-slate-700 leading-relaxed font-medium">
                          {question}
                        </p>
                        <button
                          onClick={() => {
                            onSelectQuestion(question);
                            onClose();
                          }}
                          className="shrink-0 p-1 rounded-md text-blue-600 hover:bg-blue-50 flex items-center gap-1 font-semibold text-[11px]"
                          title="Ask bot this question"
                        >
                          <span>Ask</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

