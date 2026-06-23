import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, SkipForward, Clock, Eye, ArrowLeft, ChevronDown, ChevronUp, Flag } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { getAttemptById, getTestById, getQuestionsByIds } from '../lib/storage';
import { formatTime, cn, SECTION_INFO } from '../lib/utils';
import { scoreQuestion } from '../lib/scoring';

export default function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [attempt, setAttempt] = useState(null);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  
  const [filter, setFilter] = useState('All');
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    const att = getAttemptById(id);
    if (!att) {
      navigate('/tests');
      return;
    }
    
    const t = getTestById(att.testId);
    if (!t) {
      navigate('/tests');
      return;
    }

    const allQIds = t.sections.flatMap(s => s.questionIds);
    const qs = getQuestionsByIds(allQIds);

    setAttempt(att);
    setTest(t);
    setQuestions(qs);

    // Expand all sections by default
    const expanded = {};
    t.sections.forEach(s => expanded[s.name] = true);
    setExpandedSections(expanded);
  }, [id, navigate]);

  const toggleSection = (secName) => {
    setExpandedSections(prev => ({ ...prev, [secName]: !prev[secName] }));
  };

  const processedQuestions = useMemo(() => {
    if (!attempt || !questions.length) return [];
    
    const qMap = new Map(questions.map(q => [q.id, q]));
    let result = [];
    
    test.sections.forEach(sec => {
      sec.questionIds.forEach((qId, idx) => {
        const q = qMap.get(qId);
        if (!q) return;
        
        const response = attempt.responses[qId];
        const { marks, isCorrect, isAttempted } = scoreQuestion(q, response);
        
        let status = 'Skipped';
        if (isAttempted) {
          status = isCorrect ? 'Correct' : 'Wrong';
        }
        
        const isMarked = response?.status?.includes('marked');

        result.push({
          ...q,
          sectionName: sec.name,
          numInSection: idx + 1,
          response,
          marks,
          isCorrect,
          isAttempted,
          status,
          isMarked
        });
      });
    });
    return result;
  }, [attempt, test, questions]);

  const filteredQuestions = useMemo(() => {
    if (filter === 'All') return processedQuestions;
    if (filter === 'Marked for Review') return processedQuestions.filter(q => q.isMarked);
    return processedQuestions.filter(q => q.status === filter);
  }, [processedQuestions, filter]);

  const groupedFiltered = useMemo(() => {
    const groups = {};
    filteredQuestions.forEach(q => {
      if (!groups[q.sectionName]) groups[q.sectionName] = [];
      groups[q.sectionName].push(q);
    });
    return groups;
  }, [filteredQuestions]);

  const counts = useMemo(() => {
    const c = { All: 0, Correct: 0, Wrong: 0, Skipped: 0, 'Marked for Review': 0 };
    processedQuestions.forEach(q => {
      c.All++;
      c[q.status]++;
      if (q.isMarked) c['Marked for Review']++;
    });
    return c;
  }, [processedQuestions]);

  if (!attempt || !test) return null;

  return (
    <PageShell
      title="Review Attempt"
      subtitle={test.name}
      actions={
        <Button variant="ghost" onClick={() => navigate(`/result/${id}`)}>
          <ArrowLeft size={18} className="mr-2" /> Back to Results
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2 sticky top-16 z-20 bg-bg/95 backdrop-blur py-4 border-b border-border">
          {Object.keys(counts).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                filter === tab 
                  ? "bg-surface-active text-white border-accent" 
                  : "bg-surface text-text-secondary border-border hover:border-text hover:text-white"
              )}
            >
              {tab} <span className="ml-1 opacity-70">({counts[tab]})</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {filteredQuestions.length === 0 ? (
          <EmptyState
            icon={Eye}
            title={`No ${filter} questions`}
            description={`You have no questions in the '${filter}' category.`}
          />
        ) : (
          test.sections.map(sec => {
            const secQs = groupedFiltered[sec.name];
            if (!secQs || secQs.length === 0) return null;

            return (
              <div key={sec.name} className="animate-fade-in">
                {/* Section Header */}
                <div 
                  className="flex items-center justify-between p-4 bg-surface rounded-t-lg border border-border cursor-pointer sticky top-36 z-10"
                  onClick={() => toggleSection(sec.name)}
                >
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: SECTION_INFO[sec.name].color }} />
                    {sec.name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-text-secondary">
                    <span>{secQs.length} questions</span>
                    {expandedSections[sec.name] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {/* Section Questions */}
                {expandedSections[sec.name] && (
                  <div className="border border-t-0 border-border rounded-b-lg bg-bg p-4 space-y-6">
                    {secQs.map(q => (
                      <QuestionReviewCard key={q.id} q={q} />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </PageShell>
  );
}

function QuestionReviewCard({ q }) {
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <Card padding className="border border-border/50 bg-surface/50">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Badge variant="section" value={q.sectionName}>Q{q.numInSection}</Badge>
          <StatusBadge status={q.status} />
          {q.isMarked && (
            <Badge variant="custom" className="bg-status-marked/20 text-status-marked border border-status-marked/30">
              <Flag size={12} className="mr-1 inline" /> Marked
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-xs font-mono text-text-secondary bg-bg px-3 py-1.5 rounded-md border border-border">
          <span className="flex items-center gap-1" title="Time spent"><Clock size={14} className="text-accent" /> {formatTime(q.response?.timeTaken || 0)}</span>
          <span className="flex items-center gap-1" title="Visit count"><Eye size={14} className="text-warning" /> {q.response?.visitCount || 0}</span>
          <span className={cn(
            "font-bold ml-2",
            q.marks > 0 ? "text-success" : q.marks < 0 ? "text-error" : "text-text-dim"
          )}>
            {q.marks > 0 ? `+${q.marks}` : q.marks} marks
          </span>
        </div>
      </div>

      <div className="text-white whitespace-pre-wrap mb-4 pl-1 border-l-2 border-border">
        {q.questionText}
      </div>
      {q.questionImage && (
        <img src={q.questionImage} alt="Question" className="mt-2 mb-4 max-h-64 rounded-md object-contain" />
      )}

      {/* Options / Answer */}
      <div className="mt-6 mb-6">
        {q.type === 'MCQ' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {q.options.map(opt => {
              const isCorrectOpt = q.correctOption === opt.id;
              const isUserOpt = q.response?.selectedOption === opt.id;
              
              let optStyle = "bg-bg border-border text-text";
              let badge = null;

              if (isCorrectOpt) {
                optStyle = "bg-success-muted border-success shadow-[0_0_10px_rgba(34,197,94,0.1)]";
                badge = <CheckCircle size={18} className="text-success shrink-0" />;
              } else if (isUserOpt) {
                // User picked wrong
                optStyle = "bg-error-muted border-error";
                badge = <XCircle size={18} className="text-error shrink-0" />;
              }

              return (
                <div key={opt.id} className={cn("p-3 rounded-md border flex items-start justify-between gap-3 transition-colors", optStyle)}>
                  <div className="flex items-start gap-3">
                    <span className={cn("font-bold", isCorrectOpt ? "text-success" : isUserOpt ? "text-error" : "text-text-secondary")}>
                      {opt.id}.
                    </span>
                    <div>
                      {opt.text && <p className={isCorrectOpt || isUserOpt ? "text-white font-medium" : "text-text"}>{opt.text}</p>}
                      {opt.image && <img src={opt.image} alt={`Option ${opt.id}`} className="mt-2 max-h-24 rounded-sm object-contain" />}
                    </div>
                  </div>
                  {badge}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 bg-bg p-4 rounded-md border border-border">
              <p className="text-xs text-text-secondary uppercase mb-1">Your Answer</p>
              <p className={cn(
                "font-mono text-lg font-bold",
                !q.isAttempted ? "text-text-dim" : q.isCorrect ? "text-success" : "text-error"
              )}>
                {q.response?.typedAnswer || '—'}
              </p>
            </div>
            <div className="flex-1 bg-success-muted p-4 rounded-md border border-success">
              <p className="text-xs text-success uppercase mb-1 opacity-80">Correct Answer</p>
              <p className="font-mono text-lg font-bold text-success">{q.correctAnswer}</p>
            </div>
          </div>
        )}
      </div>

      {/* Explanation */}
      {q.explanation && (
        <div className="mt-4">
          <button 
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            {showExplanation ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showExplanation ? 'Hide Explanation' : 'View Explanation'}
          </button>
          
          {showExplanation && (
            <div className="mt-3 p-4 rounded-lg bg-accent/5 border border-accent/20 animate-fade-in text-white whitespace-pre-wrap">
              {q.explanation}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function StatusBadge({ status }) {
  switch(status) {
    case 'Correct': return <Badge variant="custom" className="bg-success/20 text-success border border-success/30"><CheckCircle size={12} className="mr-1 inline"/> Correct</Badge>;
    case 'Wrong': return <Badge variant="custom" className="bg-error/20 text-error border border-error/30"><XCircle size={12} className="mr-1 inline"/> Wrong</Badge>;
    default: return <Badge variant="custom" className="bg-surface-active text-text-secondary border border-border"><SkipForward size={12} className="mr-1 inline"/> Skipped</Badge>;
  }
}
