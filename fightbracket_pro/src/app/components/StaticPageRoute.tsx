import React from 'react';
import { STATIC_DOCS, StaticPageId } from './StaticPageModal';

interface StaticPageRouteProps {
  pageId: StaticPageId;
}

export function StaticPageRoute({ pageId }: StaticPageRouteProps) {
  const doc = STATIC_DOCS[pageId];
  const Icon = doc?.icon;

  if (!doc) {
    return (
      <div className="min-h-screen bg-[#050A14] flex items-center justify-center text-white font-mono">
        Page not found.
      </div>
    );
  }

  // Simple markdown renderer for clean display (re-used from StaticPageModal)
  const renderFormattedContent = (rawContent: string) => {
    const lines = rawContent.trim().split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-3" />;

      if (trimmed.startsWith('# ')) {
        return (
          <h1 key={idx} className="text-3xl font-bold font-rajdhani text-white border-b border-white/10 pb-2 mt-2 mb-6" style={{ color: '#00E5FF' }}>
            {trimmed.replace('# ', '')}
          </h1>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-xl font-bold font-rajdhani text-cyan-400 mt-8 mb-3">
            {trimmed.replace('## ', '')}
          </h2>
        );
      }
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-base font-bold font-mono text-white/90 mt-4 mb-2">
            {trimmed.replace('### ', '')}
          </h3>
        );
      }
      if (trimmed.startsWith('* ')) {
        return (
          <li key={idx} className="text-sm font-mono opacity-80 ml-6 list-disc space-y-1 my-1">
            {trimmed.replace('* ', '')}
          </li>
        );
      }
      return (
        <p key={idx} className="text-sm font-mono opacity-75 leading-relaxed my-3">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#050A14] flex flex-col">
      <div className="flex-1 w-full max-w-4xl mx-auto p-6 md:p-12">
        
        <div className="mb-8 pb-4 border-b border-white/10 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/10">
            {Icon && <Icon size={32} className="text-cyan-400" />}
          </div>
          <div>
            <h1 className="text-4xl font-bold font-rajdhani tracking-widest text-white">
              {doc.title}
            </h1>
            <p className="font-mono text-xs text-gray-500 mt-1 uppercase tracking-widest">
              FightBracket Pro Legal & Info Center
            </p>
          </div>
        </div>

        <div className="bg-[#070D1B] border border-white/5 rounded-2xl p-8 shadow-2xl">
          {renderFormattedContent(doc.content)}
        </div>
        
        <div className="mt-12 text-center pb-8">
          <a href="/" className="inline-block px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white font-mono font-bold text-xs transition-colors border border-white/10">
            ← BACK TO APP
          </a>
        </div>
      </div>
    </div>
  );
}
