import React, { useState } from 'react';
import { cn, SECTION_INFO } from '../../lib/utils';
import ImageZoom from '../ui/ImageZoom';

export default function QuestionDisplay({
  question,
  response,
  onSelectOption,
  onTypeAnswer,
  questionNumber,
  totalInSection,
  sectionName
}) {
  const [zoomedImage, setZoomedImage] = useState(null);

  if (!question) return null;

  const sectionColor = SECTION_INFO[sectionName]?.color || '#6C63FF';

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-surface flex justify-between items-center">
        <h2 className="font-bold text-white flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: sectionColor }} />
          {sectionName}
        </h2>
        <div className="font-mono text-text-secondary bg-bg px-3 py-1 rounded-md border border-border">
          Question <span className="text-white font-bold">{questionNumber}</span> of {totalInSection}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          
          {/* Question Text & Image */}
          <div className="mb-10 text-lg leading-relaxed text-white whitespace-pre-wrap">
            {question.questionText}
            {question.questionImage && (
              <div className="mt-6">
                <img 
                  src={question.questionImage} 
                  alt="Question" 
                  className="max-h-80 rounded-lg border border-border cursor-zoom-in hover:border-accent transition-colors shadow-sm"
                  onClick={() => setZoomedImage(question.questionImage)}
                />
              </div>
            )}
          </div>

          {/* Answer Area */}
          <div className="border-t border-border pt-8 mt-8">
            {question.type === 'MCQ' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {question.options.map((opt, idx) => {
                  const isSelected = response?.selectedOption === opt.id;
                  
                  return (
                    <button
                      key={opt.id}
                      onClick={() => onSelectOption(opt.id)}
                      className={cn(
                        "text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                        isSelected 
                          ? "bg-accent-muted border-accent shadow-glow scale-[1.01]" 
                          : "bg-surface border-border hover:border-text-secondary hover:bg-surface-hover"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm transition-colors border-2",
                        isSelected ? "bg-accent text-white border-accent" : "border-text-secondary text-text-secondary"
                      )}>
                        {opt.id}
                      </div>
                      <div className="flex-1 mt-1">
                        {opt.text && <p className={cn("leading-relaxed", isSelected ? "text-white font-medium" : "text-text")}>{opt.text}</p>}
                        {opt.image && (
                          <img 
                            src={opt.image} 
                            alt={`Option ${opt.id}`} 
                            className="mt-3 max-h-32 rounded border border-border cursor-zoom-in"
                            onClick={(e) => {
                              e.stopPropagation();
                              setZoomedImage(opt.image);
                            }}
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="max-w-md">
                <label className="block text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  Numerical Answer
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Type your answer here..."
                  value={response?.typedAnswer || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Allow only numbers, decimal points, and minus sign
                    if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                      onTypeAnswer(val);
                    }
                  }}
                  className="w-full bg-surface border-2 border-border focus:border-accent rounded-lg px-4 py-3 text-white text-xl font-mono shadow-sm transition-colors outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <ImageZoom 
        isOpen={!!zoomedImage} 
        onClose={() => setZoomedImage(null)} 
        src={zoomedImage} 
      />
    </div>
  );
}
