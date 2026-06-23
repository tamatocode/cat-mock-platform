import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, BarChart3, Trash2, FileText, Clock, HelpCircle } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { getTests, deleteTest, getAttemptsByTestId } from '../lib/storage';
import { formatDate, cn } from '../lib/utils';

export default function TestsList() {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [tests, setTests] = useState([]);
  const [attemptsMap, setAttemptsMap] = useState({});
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    setLoading(true);
    const ts = await getTests();
    const allTests = ts.sort((a, b) => b.createdAt - a.createdAt);
    setTests(allTests);
    
    // Load attempts for each test to show status badge
    const map = {};
    for (const t of allTests) {
      const atts = await getAttemptsByTestId(t.id);
      map[t.id] = atts.sort((a, b) => b.endTime - a.endTime);
    }
    setAttemptsMap(map);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await deleteTest(deleteConfirmId);
      toast.success('Test deleted successfully');
      setDeleteConfirmId(null);
      loadTests();
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PageShell>
    );
  }

  if (tests.length === 0) {
    return (
      <PageShell title="My Tests">
        <div className="mt-12">
          <EmptyState
            icon={FileText}
            title="No tests created yet"
            description="Create your first mock test to get started with your preparation."
            actionLabel="Create Mock Test"
            onAction={() => navigate('/create-test')}
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell 
      title="My Tests" 
      actions={
        <Button variant="primary" onClick={() => navigate('/create-test')} icon={<Plus size={18} />}>
          Create New Test
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 stagger-children">
        {tests.map(test => {
          const attempts = attemptsMap[test.id] || [];
          const hasAttempted = attempts.length > 0;
          const latestAttempt = hasAttempted ? attempts[0] : null;
          
          const totalQuestions = test.sections.reduce((acc, sec) => acc + sec.questionIds.length, 0);

          return (
            <Card key={test.id} hover padding={false} className="flex flex-col group border-border hover:border-accent/50 transition-colors duration-300 relative overflow-hidden">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-white leading-tight pr-4">{test.name}</h3>
                  <Badge 
                    variant="custom" 
                    className={cn(
                      "shrink-0 whitespace-nowrap",
                      hasAttempted ? "bg-accent-muted text-accent" : "bg-surface-active text-text-secondary"
                    )}
                  >
                    {hasAttempted ? `Attempted (${attempts.length})` : 'Not Attempted'}
                  </Badge>
                </div>
                
                <p className="text-xs text-text-dim mb-4 flex items-center gap-1">
                  <Clock size={12} /> Created on {formatDate(test.createdAt)}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {test.sections.map(sec => (
                    <Badge key={sec.name} variant="section" value={sec.name}>{sec.name}</Badge>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-text-secondary font-medium uppercase mb-1 flex items-center gap-1"><HelpCircle size={14}/> Questions</p>
                    <p className="text-lg font-bold text-white">{totalQuestions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary font-medium uppercase mb-1 flex items-center gap-1"><Clock size={14}/> Duration</p>
                    <p className="text-lg font-bold text-white">{test.duration} <span className="text-sm font-normal text-text-secondary">min</span></p>
                  </div>
                </div>
              </div>

              <div className="bg-surface-hover p-4 border-t border-border flex flex-wrap gap-3 mt-auto">
                <Button 
                  variant="primary" 
                  className="flex-1 min-w-[120px] shadow-glow" 
                  onClick={() => navigate(`/test/${test.id}`)}
                >
                  <Play size={16} className="mr-2" /> Take Test
                </Button>
                
                {hasAttempted && (
                  <Button 
                    variant="secondary" 
                    className="flex-1 min-w-[120px]" 
                    onClick={() => navigate(`/result/${latestAttempt.id}`)}
                  >
                    <BarChart3 size={16} className="mr-2" /> Results
                  </Button>
                )}
                
                <Button 
                  variant="ghost" 
                  className="px-3 text-text-secondary hover:text-error hover:bg-error-muted" 
                  onClick={() => setDeleteConfirmId(test.id)}
                  aria-label="Delete test"
                >
                  <Trash2 size={18} />
                </Button>
              </div>

              {/* Decorative accent line on top hover */}
              <div className="absolute top-0 left-0 w-full h-1 bg-accent transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            </Card>
          );
        })}
      </div>

      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Mock Test"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-text">
          Are you sure you want to delete this test? 
          <strong> All attempt history and results for this test will also be deleted.</strong> This cannot be undone.
        </p>
      </Modal>
    </PageShell>
  );
}
