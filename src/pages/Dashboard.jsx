import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Library, FileText, Target, TrendingUp, PlusCircle, FilePlus, Play, ArrowRight, Clock, Trophy, BarChart3 } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import BarChart from '../components/ui/BarChart';
import { getQuestions, getTests, getAttempts, getTestById } from '../lib/storage';
import { formatDate, formatRelativeTime, SECTION_INFO } from '../lib/utils';
import { getPercentile } from '../lib/scoring';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    questions: 0,
    tests: 0,
    attempts: 0,
    avgScore: 'N/A'
  });
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [distribution, setDistribution] = useState([]);

  useEffect(() => {
    const questions = getQuestions();
    const tests = getTests();
    const attempts = getAttempts();

    // Calculate Avg Score
    let avgScore = 'N/A';
    if (attempts.length > 0) {
      const totalScore = attempts.reduce((acc, att) => acc + (att.score?.total || 0), 0);
      avgScore = (totalScore / attempts.length).toFixed(1);
    }

    setStats({
      questions: questions.length,
      tests: tests.length,
      attempts: attempts.length,
      avgScore
    });

    // Recent Attempts
    const sortedAttempts = [...attempts].sort((a, b) => b.endTime - a.endTime).slice(0, 3);
    setRecentAttempts(sortedAttempts);

    // Distribution
    const distMap = { VARC: 0, DILR: 0, QA: 0 };
    questions.forEach(q => {
      if (distMap[q.section] !== undefined) {
        distMap[q.section]++;
      }
    });

    setDistribution([
      { label: 'VARC', value: distMap.VARC, color: SECTION_INFO.VARC.color },
      { label: 'DILR', value: distMap.DILR, color: SECTION_INFO.DILR.color },
      { label: 'QA', value: distMap.QA, color: SECTION_INFO.QA.color },
    ]);

  }, []);

  return (
    <PageShell>
      {/* Welcome Header */}
      <div className="mb-10 animate-fade-in">
        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-accent mb-2">
          CAT Mock Test Platform
        </h1>
        <p className="text-text-secondary text-lg">Track your preparation progress and master the exam.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 stagger-children">
        <StatCard title="Questions in Bank" value={stats.questions} icon={Library} color="text-accent" bgColor="bg-accent-muted" />
        <StatCard title="Mocks Created" value={stats.tests} icon={FileText} color="text-warning" bgColor="bg-warning-muted" />
        <StatCard title="Tests Attempted" value={stats.attempts} icon={Target} color="text-success" bgColor="bg-success-muted" />
        <StatCard title="Average Score" value={stats.avgScore} icon={TrendingUp} color="text-accent" bgColor="bg-accent-muted" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 stagger-children">
        <ActionCard
          title="Add Question"
          description="Build your question bank"
          icon={PlusCircle}
          onClick={() => navigate('/add-question')}
          variant="accent"
        />
        <ActionCard
          title="Create Mock Test"
          description="Design a custom exam"
          icon={FilePlus}
          onClick={() => navigate('/create-test')}
          variant="secondary"
        />
        <ActionCard
          title="Take a Test"
          description="Start a timed attempt"
          icon={Play}
          onClick={() => navigate('/tests')}
          variant="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Clock className="text-text-secondary" size={20} />
                Recent Test Attempts
              </h2>
              {recentAttempts.length > 0 && (
                <Link to="/tests" className="text-sm text-accent hover:text-accent-hover flex items-center gap-1 transition-colors">
                  View all <ArrowRight size={14} />
                </Link>
              )}
            </div>
            
            {recentAttempts.length > 0 ? (
              <div className="space-y-4">
                {recentAttempts.map(attempt => {
                  const test = getTestById(attempt.testId);
                  const percentile = getPercentile(attempt.score?.total || 0);
                  
                  return (
                    <div 
                      key={attempt.id} 
                      onClick={() => navigate(`/result/${attempt.id}`)}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-bg rounded-lg border border-border hover:border-accent cursor-pointer transition-all"
                    >
                      <div className="mb-3 sm:mb-0">
                        <h3 className="font-semibold text-white group-hover:text-accent transition-colors">
                          {test?.name || 'Unknown Test'}
                        </h3>
                        <p className="text-sm text-text-secondary mt-1">
                          {formatRelativeTime(attempt.endTime)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-white">
                            {attempt.score?.total} <span className="text-xs text-text-secondary font-normal">/ {attempt.score?.maxPossible || '?'}</span>
                          </p>
                        </div>
                        <Badge variant="custom" className="bg-accent-muted text-accent font-mono text-sm px-2 py-1">
                          {percentile.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Trophy className="text-border-light mb-4" size={48} />
                <p className="text-text-secondary">No tests attempted yet.</p>
                <Button variant="ghost" className="mt-4 text-accent" onClick={() => navigate('/tests')}>
                  Go to Tests
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Distribution Chart */}
        <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <BarChart3 className="text-text-secondary" size={20} />
              Question Bank Distribution
            </h2>
            
            {stats.questions > 0 ? (
              <div className="mt-4">
                <BarChart data={distribution} />
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Library className="text-border-light mb-4" size={48} />
                <p className="text-text-secondary">Add questions to see distribution.</p>
                <Button variant="ghost" className="mt-4 text-accent" onClick={() => navigate('/add-question')}>
                  Add Question
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function StatCard({ title, value, icon: Icon, color, bgColor }) {
  return (
    <Card className="flex items-center p-6" hover={false}>
      <div className={`p-4 rounded-xl mr-5 ${bgColor}`}>
        <Icon className={color} size={28} />
      </div>
      <div>
        <p className="text-3xl font-bold text-white mb-1">{value}</p>
        <p className="text-sm font-medium text-text-secondary">{title}</p>
      </div>
    </Card>
  );
}

function ActionCard({ title, description, icon: Icon, onClick, variant }) {
  const isAccent = variant === 'accent';
  const isSuccess = variant === 'success';
  
  return (
    <Card 
      hover 
      className={`cursor-pointer overflow-hidden group border transition-all duration-300 ${
        isAccent ? 'border-accent/30 hover:border-accent hover:shadow-glow bg-surface' :
        isSuccess ? 'border-success/30 hover:border-success bg-surface' :
        'border-border hover:border-text-secondary bg-surface'
      }`}
      onClick={onClick}
    >
      <div className="p-6 flex flex-col h-full relative z-10">
        <Icon className={`mb-4 ${isAccent ? 'text-accent' : isSuccess ? 'text-success' : 'text-text'}`} size={32} />
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-text-secondary flex-1">{description}</p>
        <div className="mt-4 flex items-center text-sm font-medium text-text group-hover:text-white transition-colors">
          Get Started <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
      {/* Decorative gradient blob */}
      <div className={`absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity z-0 ${
        isAccent ? 'bg-accent' : isSuccess ? 'bg-success' : 'bg-white'
      }`} />
    </Card>
  );
}
