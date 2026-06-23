import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Trophy, Clock, Target, TrendingUp, ArrowLeft, RotateCcw, ChevronRight, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import BarChart from '../components/ui/BarChart';
import { getAttemptById, getTestById, getQuestionsByIds } from '../lib/storage';
import { formatTime, cn, SECTION_INFO } from '../lib/utils';
import { getPercentile } from '../lib/scoring';

export default function ResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [attempt, setAttempt] = useState(null);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);

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
  }, [id, navigate]);

  const difficultyData = useMemo(() => {
    if (!attempt || !questions.length) return [];
    
    const qMap = new Map(questions.map(q => [q.id, q]));
    const diffStats = { Easy: { c: 0, w: 0 }, Medium: { c: 0, w: 0 }, Hard: { c: 0, w: 0 } };
    
    Object.entries(attempt.responses).forEach(([qId, res]) => {
      const q = qMap.get(qId);
      if (!q) return;
      
      const hasAnswer = q.type === 'MCQ' ? !!res.selectedOption : !!res.typedAnswer;
      if (!hasAnswer) return;

      let isCorrect = false;
      if (q.type === 'MCQ') {
        isCorrect = res.selectedOption === q.correctOption;
      } else {
        const u = parseFloat(res.typedAnswer);
        const c = parseFloat(q.correctAnswer);
        isCorrect = !isNaN(u) && !isNaN(c) && Math.abs(u - c) <= 0.01;
      }

      if (isCorrect) diffStats[q.difficulty].c++;
      else diffStats[q.difficulty].w++;
    });

    return [
      { label: 'Easy Correct', value: diffStats.Easy.c, color: '#22C55E' },
      { label: 'Easy Wrong', value: diffStats.Easy.w, color: '#EF4444' },
      { label: 'Medium Correct', value: diffStats.Medium.c, color: '#22C55E' },
      { label: 'Medium Wrong', value: diffStats.Medium.w, color: '#EF4444' },
      { label: 'Hard Correct', value: diffStats.Hard.c, color: '#22C55E' },
      { label: 'Hard Wrong', value: diffStats.Hard.w, color: '#EF4444' },
    ].filter(d => d.value > 0);
  }, [attempt, questions]);

  if (!attempt || !test) return null;

  const score = attempt.score;
  const percentile = getPercentile(score.total);
  const accuracy = score.attempted > 0 ? Math.round((score.correct / score.attempted) * 100) : 0;
  
  // Wrong TITA vs Wrong MCQ
  const wrongMCQ = questions.filter(q => {
    const res = attempt.responses[q.id];
    if (!res || q.type !== 'MCQ') return false;
    return res.selectedOption && res.selectedOption !== q.correctOption;
  }).length;
  
  const wrongTITA = score.incorrect - wrongMCQ;

  const avgTime = attempt.timeTaken / questions.length;

  return (
    <PageShell
      title="Test Results"
      subtitle={test.name}
      actions={
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => navigate('/tests')}>Back to Tests</Button>
          <Button variant="primary" onClick={() => navigate(`/review/${attempt.id}`)}>
            Review Questions <ChevronRight size={18} className="ml-1" />
          </Button>
        </div>
      }
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        
        {/* Score Summary Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          <Card className="lg:col-span-2 bg-gradient-to-br from-surface to-surface-hover border-accent/20 relative overflow-hidden flex flex-col sm:flex-row items-center p-8 gap-8">
            <div className="relative z-10 flex flex-col items-center justify-center shrink-0 w-48 h-48 rounded-full border-8 border-bg bg-surface shadow-[0_0_40px_rgba(108,99,255,0.2)]">
              {/* Circular progress simulated by border */}
              <div 
                className="absolute inset-0 rounded-full border-8 border-accent"
                style={{ clipPath: `polygon(0 0, 100% 0, 100% ${Math.max(0, (score.total/score.maxPossible)*100)}%, 0 100%)` }}
              />
              <p className="text-5xl font-black text-white relative z-10 tracking-tighter">{score.total}</p>
              <p className="text-text-secondary relative z-10">/ {score.maxPossible}</p>
            </div>
            
            <div className="relative z-10 text-center sm:text-left flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Your Score</h2>
                <p className="text-text-secondary">Based on CAT marking scheme</p>
              </div>
              <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
                <div className="bg-bg/50 px-4 py-2 rounded-lg border border-border">
                  <p className="text-xs text-text-secondary uppercase font-semibold mb-1">Percentile</p>
                  <p className="text-xl font-bold text-accent">{percentile.label}</p>
                </div>
                <div className="bg-bg/50 px-4 py-2 rounded-lg border border-border">
                  <p className="text-xs text-text-secondary uppercase font-semibold mb-1">Accuracy</p>
                  <p className="text-xl font-bold text-white">{accuracy}%</p>
                </div>
              </div>
            </div>
            
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
          </Card>

          <Card className="flex flex-col justify-center space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-bg rounded-lg border border-border"><Clock className="text-accent" size={24} /></div>
              <div>
                <p className="text-sm text-text-secondary uppercase font-semibold">Time Taken</p>
                <p className="text-xl font-bold text-white">{formatTime(attempt.timeTaken)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-bg rounded-lg border border-border"><Target className="text-success" size={24} /></div>
              <div>
                <p className="text-sm text-text-secondary uppercase font-semibold">Attempted</p>
                <p className="text-xl font-bold text-white">{score.attempted} / {questions.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-bg rounded-lg border border-border"><TrendingUp className="text-warning" size={24} /></div>
              <div>
                <p className="text-sm text-text-secondary uppercase font-semibold">Avg Time/Q</p>
                <p className="text-xl font-bold text-white">{Math.round(avgTime)}s</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Section Table */}
        <Card padding={false} className="overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-secondary uppercase bg-surface-active border-b border-border">
                <tr>
                  <th className="py-4 px-6">Section</th>
                  <th className="py-4 px-6 text-center">Questions</th>
                  <th className="py-4 px-6 text-center">Attempted</th>
                  <th className="py-4 px-6 text-center text-success">Correct</th>
                  <th className="py-4 px-6 text-center text-error">Wrong</th>
                  <th className="py-4 px-6 text-center">Score</th>
                  <th className="py-4 px-6 text-center">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {test.sections.map(sec => {
                  const sScore = score.sections[sec.name];
                  if (!sScore) return null;
                  return (
                    <tr key={sec.name} className="bg-surface hover:bg-surface-hover transition-colors">
                      <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: SECTION_INFO[sec.name].color }} />
                        {sec.name}
                      </td>
                      <td className="py-4 px-6 text-center">{sScore.questions}</td>
                      <td className="py-4 px-6 text-center">{sScore.attempted}</td>
                      <td className="py-4 px-6 text-center text-success font-medium">{sScore.correct}</td>
                      <td className="py-4 px-6 text-center text-error font-medium">{sScore.incorrect}</td>
                      <td className="py-4 px-6 text-center font-bold text-accent">{sScore.score}</td>
                      <td className="py-4 px-6 text-center">{sScore.accuracy}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Bottom Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Card padding>
            <h3 className="text-lg font-bold text-white mb-6">Detailed Breakdown</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-bg p-4 rounded-lg border border-border border-l-4 border-l-success">
                <p className="text-text-secondary text-sm mb-1 flex items-center gap-1">
                  <CheckCircle size={14} className="text-success" /> Correct (+3)
                </p>
                <p className="text-2xl font-bold text-white">{score.correct}</p>
              </div>
              <div className="bg-bg p-4 rounded-lg border border-border border-l-4 border-l-error">
                <p className="text-text-secondary text-sm mb-1 flex items-center gap-1">
                  <XCircle size={14} className="text-error" /> Wrong MCQ (-1)
                </p>
                <p className="text-2xl font-bold text-white">{wrongMCQ}</p>
              </div>
              <div className="bg-bg p-4 rounded-lg border border-border border-l-4 border-l-warning">
                <p className="text-text-secondary text-sm mb-1 flex items-center gap-1">
                  <XCircle size={14} className="text-warning" /> Wrong TITA (0)
                </p>
                <p className="text-2xl font-bold text-white">{wrongTITA}</p>
              </div>
              <div className="bg-bg p-4 rounded-lg border border-border border-l-4 border-l-text-dim">
                <p className="text-text-secondary text-sm mb-1 flex items-center gap-1">
                  <MinusCircle size={14} /> Unattempted (0)
                </p>
                <p className="text-2xl font-bold text-white">{score.unattempted}</p>
              </div>
            </div>
          </Card>

          <Card padding>
            <h3 className="text-lg font-bold text-white mb-6">Difficulty Performance</h3>
            {difficultyData.length > 0 ? (
              <BarChart data={difficultyData} />
            ) : (
              <div className="flex items-center justify-center h-40 text-text-secondary border border-dashed border-border rounded-lg">
                No attempt data available
              </div>
            )}
          </Card>
        </div>

      </div>
    </PageShell>
  );
}
