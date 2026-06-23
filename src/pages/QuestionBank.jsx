import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Pencil, Trash2, Eye, BookOpen, Plus } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { getQuestions, deleteQuestion, deleteQuestions } from '../lib/storage';
import { truncateText, cn, formatDate, SECTIONS, DIFFICULTIES, QUESTION_TYPES } from '../lib/utils';

export default function QuestionBank() {
  const navigate = useNavigate();
  const toast = useToast();
  const [questions, setQuestions] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  // Filters
  const [filterSection, setFilterSection] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterDifficulty, setFilterDifficulty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    const qs = await getQuestions();
    setQuestions(qs.sort((a, b) => b.createdAt - a.createdAt));
    setSelectedIds(new Set());
    setLoading(false);
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchSection = filterSection === 'All' || q.section === filterSection;
      const matchType = filterType === 'All' || q.type === filterType;
      const matchDiff = filterDifficulty === 'All' || q.difficulty === filterDifficulty;
      const matchSearch = q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          q.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSection && matchType && matchDiff && matchSearch;
    });
  }, [questions, filterSection, filterType, filterDifficulty, searchQuery]);

  const handleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredQuestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuestions.map(q => q.id)));
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await deleteQuestion(deleteConfirmId);
      toast.success('Question deleted successfully');
      setDeleteConfirmId(null);
      loadQuestions();
    } else if (bulkDeleteConfirm) {
      await deleteQuestions(Array.from(selectedIds));
      toast.success(`${selectedIds.size} questions deleted`);
      setBulkDeleteConfirm(false);
      loadQuestions();
    }
  };

  const FilterButtons = ({ options, value, onChange }) => (
    <div className="flex flex-wrap gap-2">
      {['All', ...options].map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
            value === opt 
              ? "bg-surface-active text-white border-accent" 
              : "bg-transparent text-text border-border hover:border-text-secondary hover:text-white"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PageShell>
    );
  }

  if (questions.length === 0) {
    return (
      <PageShell title="Question Bank">
        <div className="mt-12">
          <EmptyState
            icon={BookOpen}
            title="No questions yet"
            description="Start building your question bank to create mock tests."
            actionLabel="Add Your First Question"
            onAction={() => navigate('/add-question')}
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell 
      title="Question Bank" 
      actions={
        <Button variant="primary" onClick={() => navigate('/add-question')} icon={<Plus size={18} />}>
          Add Question
        </Button>
      }
    >
      {/* Sticky Filter Bar */}
      <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur pt-2 pb-4 mb-6 border-b border-border">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          <div className="xl:col-span-3 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search questions or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search size={18} className="text-text-secondary" />}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase mb-2">Section</p>
                <FilterButtons options={SECTIONS} value={filterSection} onChange={setFilterSection} />
              </div>
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase mb-2">Type</p>
                <FilterButtons options={QUESTION_TYPES} value={filterType} onChange={setFilterType} />
              </div>
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase mb-2">Difficulty</p>
                <FilterButtons options={DIFFICULTIES} value={filterDifficulty} onChange={setFilterDifficulty} />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col justify-end xl:items-end pb-2">
            <p className="text-sm text-text-secondary font-medium">
              Showing <span className="text-white">{filteredQuestions.length}</span> of {questions.length}
            </p>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="bg-surface-active border border-accent/30 p-3 rounded-lg mb-6 flex flex-wrap items-center justify-between gap-4 animate-scale-in origin-top">
          <div className="flex items-center gap-4">
            <Badge variant="custom" className="bg-accent text-white">{selectedIds.size} Selected</Badge>
            <Button variant="ghost" size="sm" onClick={handleSelectAll}>
              {selectedIds.size === filteredQuestions.length ? 'Deselect All' : 'Select All Filtered'}
            </Button>
          </div>
          <Button variant="danger" size="sm" icon={<Trash2 size={16} />} onClick={() => setBulkDeleteConfirm(true)}>
            Delete Selected
          </Button>
        </div>
      )}

      {/* Question List */}
      <div className="space-y-4 pb-12">
        {filteredQuestions.map((q, idx) => (
          <Card 
            key={q.id} 
            hover 
            padding={false}
            className={cn("animate-fade-in", selectedIds.has(q.id) && "border-accent")}
            style={{ animationDelay: `${Math.min(idx * 0.05, 0.5)}s` }}
          >
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start">
              <div className="pt-1">
                <input
                  type="checkbox"
                  checked={selectedIds.has(q.id)}
                  onChange={() => handleSelect(q.id)}
                  className="w-5 h-5 rounded border-border text-accent focus:ring-accent bg-bg cursor-pointer accent-accent"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="section" value={q.section}>{q.section}</Badge>
                  <Badge variant="type" value={q.type}>{q.type}</Badge>
                  <Badge variant="difficulty" value={q.difficulty}>{q.difficulty}</Badge>
                </div>
                
                <h3 className="text-white font-medium text-lg leading-snug mb-2 line-clamp-2">
                  {truncateText(q.questionText, 150)}
                  {!q.questionText && q.questionImage && <span className="text-text-secondary italic">[Image Question]</span>}
                </h3>
                
                <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                  <div className="flex flex-wrap gap-2">
                    {q.tags.map(tag => (
                      <span key={tag} className="text-xs text-text-dim bg-bg px-2 py-1 rounded-md border border-border">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-text-secondary font-mono">
                    {formatDate(q.createdAt)}
                  </span>
                </div>
              </div>

              <div className="flex sm:flex-col gap-2 shrink-0 self-end sm:self-start w-full sm:w-auto mt-4 sm:mt-0">
                <Button variant="ghost" size="sm" onClick={() => setPreviewQuestion(q)} className="flex-1 sm:flex-none justify-center">
                  <Eye size={16} /> <span className="sm:hidden ml-2">Preview</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/add-question?edit=${q.id}`)} className="flex-1 sm:flex-none justify-center">
                  <Pencil size={16} /> <span className="sm:hidden ml-2">Edit</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(q.id)} className="text-error hover:text-error flex-1 sm:flex-none justify-center">
                  <Trash2 size={16} /> <span className="sm:hidden ml-2">Delete</span>
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {filteredQuestions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-text-secondary">No questions match your current filters.</p>
            <Button variant="ghost" className="mt-2 text-accent" onClick={() => {
              setFilterSection('All');
              setFilterType('All');
              setFilterDifficulty('All');
              setSearchQuery('');
            }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId || bulkDeleteConfirm}
        onClose={() => {
          setDeleteConfirmId(null);
          setBulkDeleteConfirm(false);
        }}
        title="Delete Question(s)"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => {
              setDeleteConfirmId(null);
              setBulkDeleteConfirm(false);
            }}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-text">
          Are you sure you want to delete {bulkDeleteConfirm ? `${selectedIds.size} selected questions` : 'this question'}? 
          This action cannot be undone.
        </p>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewQuestion}
        onClose={() => setPreviewQuestion(null)}
        title="Question Preview"
        size="lg"
      >
        {previewQuestion && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="section" value={previewQuestion.section}>{previewQuestion.section}</Badge>
              <Badge variant="type" value={previewQuestion.type}>{previewQuestion.type}</Badge>
              <Badge variant="difficulty" value={previewQuestion.difficulty}>{previewQuestion.difficulty}</Badge>
            </div>

            <div className="bg-surface p-4 rounded-lg border border-border">
              <p className="text-white whitespace-pre-wrap">{previewQuestion.questionText}</p>
              {previewQuestion.questionImage && (
                <img src={previewQuestion.questionImage} alt="Question" className="mt-4 max-h-64 rounded-md object-contain" />
              )}
            </div>

            {previewQuestion.type === 'MCQ' ? (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-text-secondary uppercase">Options</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {previewQuestion.options.map(opt => {
                    const isCorrect = previewQuestion.correctOption === opt.id;
                    return (
                      <div 
                        key={opt.id} 
                        className={cn(
                          "p-3 rounded-md border flex items-start gap-3",
                          isCorrect ? "bg-success-muted border-success" : "bg-bg border-border"
                        )}
                      >
                        <span className={cn("font-bold", isCorrect ? "text-success" : "text-text-secondary")}>
                          {opt.id}.
                        </span>
                        <div>
                          {opt.text && <p className={isCorrect ? "text-white font-medium" : "text-text"}>{opt.text}</p>}
                          {opt.image && <img src={opt.image} alt={`Option ${opt.id}`} className="mt-2 max-h-24 rounded-sm object-contain" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <h4 className="text-sm font-semibold text-text-secondary uppercase mb-2">Correct Answer</h4>
                <div className="inline-block bg-success-muted border border-success px-4 py-2 rounded-md">
                  <span className="text-success font-bold font-mono text-lg">{previewQuestion.correctAnswer}</span>
                </div>
              </div>
            )}

            {previewQuestion.explanation && (
              <div>
                <h4 className="text-sm font-semibold text-text-secondary uppercase mb-2">Explanation</h4>
                <div className="bg-bg p-4 rounded-lg border border-border">
                  <p className="text-text whitespace-pre-wrap">{previewQuestion.explanation}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageShell>
  );
}
