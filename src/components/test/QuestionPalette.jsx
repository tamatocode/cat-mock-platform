import React from 'react';
import { cn, SECTION_INFO } from '../../lib/utils';

export default function QuestionPalette({ 
  sections, 
  responses, 
  currentSectionIndex, 
  currentQuestionIndex, 
  onJump, 
  onSectionChange 
}) {
  const currentSection = sections[currentSectionIndex];

  const getStatusClass = (qId, isCurrent) => {
    const res = responses[qId];
    let base = "bg-status-not-visited text-text border-transparent"; // default
    
    if (res) {
      if (res.status === 'answered') {
        base = "bg-status-answered text-white border-transparent";
      } else if (res.status === 'not-answered') {
        base = "bg-status-not-answered text-white border-transparent";
      } else if (res.status === 'marked-for-review') {
        base = "bg-status-marked text-white border-transparent";
      } else if (res.status === 'answered-and-marked') {
        base = "bg-status-answered-marked text-white border-transparent";
      }
    }

    if (isCurrent) {
      return cn(base, "ring-2 ring-accent ring-offset-2 ring-offset-surface scale-110 shadow-lg");
    }
    
    return cn(base, "hover:opacity-80 border");
  };

  return (
    <div className="flex flex-col h-full bg-surface border-l border-border">
      {/* Section Tabs */}
      <div className="flex flex-col border-b border-border">
        {sections.map((sec, idx) => (
          <button
            key={sec.name}
            onClick={() => onSectionChange(idx)}
            className={cn(
              "px-4 py-3 text-left font-medium text-sm transition-colors border-l-4",
              currentSectionIndex === idx 
                ? "bg-surface-active text-white" 
                : "text-text-secondary hover:bg-surface-hover hover:text-white border-transparent"
            )}
            style={{ 
              borderLeftColor: currentSectionIndex === idx ? SECTION_INFO[sec.name].color : 'transparent' 
            }}
          >
            {sec.name}
          </button>
        ))}
      </div>

      {/* Palette Grid */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <h3 className="text-sm font-bold text-white mb-4">Choose a Question</h3>
        <div className="grid grid-cols-5 gap-2">
          {currentSection.questionIds.map((qId, idx) => {
            const isCurrent = idx === currentQuestionIndex;
            return (
              <button
                key={qId}
                onClick={() => onJump(currentSectionIndex, idx)}
                className={cn(
                  "w-10 h-10 rounded flex items-center justify-center text-sm font-bold transition-all",
                  getStatusClass(qId, isCurrent)
                )}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 bg-bg border-t border-border text-xs">
        <h4 className="font-bold text-text-secondary mb-3 uppercase tracking-wider">Legend</h4>
        <div className="grid grid-cols-2 gap-y-3 gap-x-2">
          <LegendItem color="bg-status-not-visited" label="Not Visited" />
          <LegendItem color="bg-status-not-answered" label="Not Answered" />
          <LegendItem color="bg-status-answered" label="Answered" />
          <LegendItem color="bg-status-marked" label="Marked" />
          <LegendItem color="bg-status-answered-marked" label="Answered & Marked" className="col-span-2" />
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label, className }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("w-4 h-4 rounded-sm shrink-0 border border-transparent shadow-sm", color)} />
      <span className="text-text leading-tight">{label}</span>
    </div>
  );
}
