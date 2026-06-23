import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Check, Search, ToggleLeft, ToggleRight, BookOpen, AlertCircle } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { getQuestions, saveTest } from '../lib/storage';
import { generateId, truncateText, cn, SECTIONS, SECTION_INFO, DIFFICULTIES, QUESTION_TYPES } from '../lib/utils';

export default function CreateTest() {
  const navigate = useNavigate();
  const toast = useToast();
  const allQuestions = useMemo(() => getQuestions(), []);

  const [step, setStep] = useState(1);
  const [testInfo, setTestInfo] = useState({
    name: '',
    duration: 120,
    enableSectionLimits: false,
  });

  const [sectionsConfig, setSectionsConfig] = useState(
    SECTIONS.reduce((acc, sec) => ({
      ...acc,
      [sec]: {
        included: true,
        timeLimit: SECTION_INFO[sec].defaultTime,
        selectedIds: new Set(),
        expanded: sec === 'VARC' // Auto-expand first
      }
    }), {})
  );

  // Filters for Step 2
  const [filters, setFilters] = useState(
    SECTIONS.reduce((acc, sec) => ({
      ...acc,
      [sec]: { diff: 'All', type: 'All', search: '' }
    }), {})
  );

  // STEP 1 VALIDATION
  const canGoToStep2 = testInfo.name.trim().length > 0 && Number(testInfo.duration) > 0;

  // STEP 2 VALIDATION
  const includedSections = SECTIONS.filter(s => sectionsConfig[s].included);
  const hasSelectedQuestions = includedSections.some(s => sectionsConfig[s].selectedIds.size > 0);
  const canGoToStep3 = includedSections.length > 0 && hasSelectedQuestions;

  const handleCreateTest = () => {
    const finalSections = SECTIONS
      .filter(sec => sectionsConfig[sec].included && sectionsConfig[sec].selectedIds.size > 0)
      .map(sec => ({
        name: sec,
        questionIds: Array.from(sectionsConfig[sec].selectedIds),
        timeLimit: testInfo.enableSectionLimits ? Number(sectionsConfig[sec].timeLimit) : null
      }));

    const newTest = {
      id: generateId(),
      name: testInfo.name.trim(),
      createdAt: Date.now(),
      duration: Number(testInfo.duration),
      sections: finalSections
    };

    const success = saveTest(newTest);
    if (success) {
      toast.success('Test created successfully!');
      navigate('/tests');
    } else {
      toast.error('Failed to save test. Storage quota exceeded.');
    }
  };

  const toggleQuestionSelect = (section, qId) => {
    setSectionsConfig(prev => {
      const newIds = new Set(prev[section].selectedIds);
      if (newIds.has(qId)) newIds.delete(qId);
      else newIds.add(qId);
      return { ...prev, [section]: { ...prev[section], selectedIds: newIds } };
    });
  };

  const getFilteredQuestionsForSection = (section) => {
    const { diff, type, search } = filters[section];
    return allQuestions.filter(q => {
      if (q.section !== section) return false;
      const matchDiff = diff === 'All' || q.difficulty === diff;
      const matchType = type === 'All' || q.type === type;
      const matchSearch = q.questionText.toLowerCase().includes(search.toLowerCase());
      return matchDiff && matchType && matchSearch;
    });
  };

  // --- RENDERING HELPERS ---

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-10">
      {[
        { num: 1, label: 'Test Info' },
        { num: 2, label: 'Build Sections' },
        { num: 3, label: 'Review & Create' }
      ].map((s, idx) => (
        <React.Fragment key={s.num}>
          <div className="flex flex-col items-center relative z-10">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300",
              step > s.num ? "bg-accent text-white" :
              step === s.num ? "bg-accent ring-4 ring-accent-muted text-white" :
              "bg-surface border-2 border-border text-text-secondary"
            )}>
              {step > s.num ? <Check size={20} /> : s.num}
            </div>
            <span className={cn(
              "absolute top-12 whitespace-nowrap text-xs font-medium transition-colors",
              step >= s.num ? "text-white" : "text-text-secondary"
            )}>
              {s.label}
            </span>
          </div>
          {idx < 2 && (
            <div className={cn(
              "w-24 md:w-32 h-1 mx-2 rounded-full transition-colors duration-300",
              step > s.num ? "bg-accent" : "bg-border"
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="max-w-xl mx-auto animate-fade-in space-y-6">
      <Card padding className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Basic Settings</h2>
          <p className="text-sm text-text-secondary mb-6">Define the fundamental properties of your mock test.</p>
        </div>

        <Input
          label="Test Name"
          placeholder="e.g. Full Mock 1 - 2026"
          value={testInfo.name}
          onChange={e => setTestInfo({ ...testInfo, name: e.target.value })}
          autoFocus
        />

        <Input
          label="Total Duration (minutes)"
          type="number"
          min="1"
          value={testInfo.duration}
          onChange={e => setTestInfo({ ...testInfo, duration: e.target.value })}
        />

        <div className="flex items-center justify-between p-4 bg-bg rounded-lg border border-border">
          <div>
            <p className="font-medium text-white">Per-section Time Limits</p>
            <p className="text-xs text-text-secondary mt-1">Enforce hard time limits for individual sections (CAT style)</p>
          </div>
          <button 
            onClick={() => setTestInfo({ ...testInfo, enableSectionLimits: !testInfo.enableSectionLimits })}
            className="text-accent focus:outline-none"
          >
            {testInfo.enableSectionLimits ? <ToggleRight size={36} /> : <ToggleLeft size={36} className="text-text-secondary" />}
          </button>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button 
          variant="primary" 
          disabled={!canGoToStep2} 
          onClick={() => setStep(2)}
          className="px-8"
        >
          Next Step <ChevronRight size={18} className="ml-1" />
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => {
    if (allQuestions.length === 0) {
      return (
        <div className="max-w-2xl mx-auto animate-fade-in">
          <EmptyState
            icon={BookOpen}
            title="Question Bank is Empty"
            description="You need to add questions to your bank before creating a mock test."
            actionLabel="Go to Add Question"
            onAction={() => navigate('/add-question')}
          />
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto animate-fade-in space-y-6 pb-20">
        {SECTIONS.map((sec) => {
          const conf = sectionsConfig[sec];
          const info = SECTION_INFO[sec];
          const sectionQuestions = getFilteredQuestionsForSection(sec);
          const totalInSection = allQuestions.filter(q => q.section === sec).length;
          
          return (
            <Card key={sec} padding={false} className="overflow-hidden">
              {/* Section Header */}
              <div 
                className={cn(
                  "p-4 flex items-center justify-between cursor-pointer border-b border-border transition-colors",
                  conf.included ? "bg-surface" : "bg-bg opacity-70"
                )}
                onClick={() => setSectionsConfig({
                  ...sectionsConfig, 
                  [sec]: { ...conf, expanded: !conf.expanded }
                })}
              >
                <div className="flex items-center gap-4">
                  <div className="pt-1" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={conf.included}
                      onChange={(e) => setSectionsConfig({
                        ...sectionsConfig, 
                        [sec]: { ...conf, included: e.target.checked, expanded: e.target.checked ? true : conf.expanded }
                      })}
                      className="w-5 h-5 rounded border-border text-accent focus:ring-accent bg-bg cursor-pointer"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: info.color }} />
                      {info.name} ({sec})
                    </h3>
                    <p className="text-xs text-text-secondary mt-1">
                      {conf.included ? `${conf.selectedIds.size} of ${totalInSection} questions selected` : 'Section excluded'}
                    </p>
                  </div>
                </div>
                <div>
                  {conf.expanded ? <ChevronRight size={20} className="rotate-90 transition-transform" /> : <ChevronRight size={20} className="transition-transform" />}
                </div>
              </div>

              {/* Section Content */}
              {conf.expanded && conf.included && (
                <div className="p-4 bg-surface-hover animate-slide-up origin-top">
                  
                  {/* Time limit if enabled */}
                  {testInfo.enableSectionLimits && (
                    <div className="mb-4 p-3 bg-bg border border-border rounded-md flex items-center gap-4 max-w-sm">
                      <label className="text-sm font-medium text-white">Section Time Limit (min):</label>
                      <Input 
                        type="number" 
                        min="1" 
                        className="w-24 !mb-0" 
                        value={conf.timeLimit}
                        onChange={(e) => setSectionsConfig({
                          ...sectionsConfig, 
                          [sec]: { ...conf, timeLimit: e.target.value }
                        })}
                      />
                    </div>
                  )}

                  {/* Filters */}
                  <div className="flex flex-wrap gap-3 mb-4 p-3 bg-bg rounded-md border border-border">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                        <input
                          type="text"
                          placeholder="Search questions..."
                          className="w-full bg-surface border border-border rounded text-sm px-9 py-1.5 focus:outline-none focus:border-accent text-white"
                          value={filters[sec].search}
                          onChange={(e) => setFilters({...filters, [sec]: {...filters[sec], search: e.target.value}})}
                        />
                      </div>
                    </div>
                    <select 
                      className="bg-surface border border-border rounded text-sm px-3 py-1.5 text-white focus:outline-none focus:border-accent"
                      value={filters[sec].type}
                      onChange={(e) => setFilters({...filters, [sec]: {...filters[sec], type: e.target.value}})}
                    >
                      <option value="All">All Types</option>
                      <option value="MCQ">MCQ</option>
                      <option value="TITA">TITA</option>
                    </select>
                    <select 
                      className="bg-surface border border-border rounded text-sm px-3 py-1.5 text-white focus:outline-none focus:border-accent"
                      value={filters[sec].diff}
                      onChange={(e) => setFilters({...filters, [sec]: {...filters[sec], diff: e.target.value}})}
                    >
                      <option value="All">All Difficulties</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  {/* Question List */}
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {sectionQuestions.length > 0 ? (
                      sectionQuestions.map(q => {
                        const isSelected = conf.selectedIds.has(q.id);
                        return (
                          <div 
                            key={q.id}
                            onClick={() => toggleQuestionSelect(sec, q.id)}
                            className={cn(
                              "p-3 rounded border cursor-pointer transition-colors flex gap-3 items-start",
                              isSelected ? "bg-accent-muted border-accent/50" : "bg-bg border-border hover:border-text-secondary"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="w-4 h-4 mt-0.5 rounded border-border text-accent focus:ring-accent bg-surface cursor-pointer pointer-events-none"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm mb-1 line-clamp-2", isSelected ? "text-white font-medium" : "text-text")}>
                                {truncateText(q.questionText, 100) || "[Image Question]"}
                              </p>
                              <div className="flex gap-2">
                                <Badge variant="type" value={q.type} className="text-[10px] px-1.5 py-0">{q.type}</Badge>
                                <Badge variant="difficulty" value={q.difficulty} className="text-[10px] px-1.5 py-0">{q.difficulty}</Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-sm text-text-secondary bg-bg rounded border border-border border-dashed">
                        No questions match your filters or section is empty.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        <div className="flex items-center justify-between pt-6 border-t border-border mt-8">
          <Button variant="ghost" onClick={() => setStep(1)}>
            <ChevronLeft size={18} className="mr-1" /> Back
          </Button>
          {!canGoToStep3 && <span className="text-sm text-error flex items-center gap-1"><AlertCircle size={14}/> Select at least 1 question</span>}
          <Button variant="primary" disabled={!canGoToStep3} onClick={() => setStep(3)} className="px-8">
            Review <ChevronRight size={18} className="ml-1" />
          </Button>
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    const includedSecs = SECTIONS.filter(s => sectionsConfig[s].included && sectionsConfig[s].selectedIds.size > 0);
    
    let totalQ = 0;
    let totalMCQ = 0;
    let totalTITA = 0;

    const tableRows = includedSecs.map(sec => {
      const qIds = Array.from(sectionsConfig[sec].selectedIds);
      const qs = allQuestions.filter(q => qIds.includes(q.id));
      const mcq = qs.filter(q => q.type === 'MCQ').length;
      const tita = qs.filter(q => q.type === 'TITA').length;
      
      totalQ += qs.length;
      totalMCQ += mcq;
      totalTITA += tita;

      return (
        <tr key={sec} className="border-b border-border bg-bg">
          <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: SECTION_INFO[sec].color }} />
            {sec}
          </td>
          <td className="py-3 px-4 text-center">{qs.length}</td>
          <td className="py-3 px-4 text-center text-text-secondary">{mcq}</td>
          <td className="py-3 px-4 text-center text-text-secondary">{tita}</td>
          <td className="py-3 px-4 text-center font-mono">
            {testInfo.enableSectionLimits ? `${sectionsConfig[sec].timeLimit}m` : '-'}
          </td>
        </tr>
      );
    });

    return (
      <div className="max-w-3xl mx-auto animate-fade-in space-y-6">
        <Card padding>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{testInfo.name}</h2>
              <p className="text-text-secondary">Duration: {testInfo.duration} minutes</p>
            </div>
            <Badge variant="custom" className="bg-accent-muted text-accent font-bold px-3 py-1">
              Max Marks: {totalQ * 3}
            </Badge>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm text-left text-text">
              <thead className="text-xs text-text-secondary uppercase bg-surface-active border-b border-border">
                <tr>
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-4 text-center">Questions</th>
                  <th className="py-3 px-4 text-center">MCQ</th>
                  <th className="py-3 px-4 text-center">TITA</th>
                  <th className="py-3 px-4 text-center">Time Limit</th>
                </tr>
              </thead>
              <tbody>
                {tableRows}
                <tr className="bg-surface font-bold text-white">
                  <td className="py-3 px-4 text-right">TOTAL</td>
                  <td className="py-3 px-4 text-center text-accent">{totalQ}</td>
                  <td className="py-3 px-4 text-center text-text-secondary">{totalMCQ}</td>
                  <td className="py-3 px-4 text-center text-text-secondary">{totalTITA}</td>
                  <td className="py-3 px-4 text-center">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex items-center justify-between pt-6 border-t border-border mt-8">
          <Button variant="ghost" onClick={() => setStep(2)}>
            <ChevronLeft size={18} className="mr-1" /> Back
          </Button>
          <Button variant="primary" onClick={handleCreateTest} className="px-8 shadow-glow">
            Create Test <Check size={18} className="ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <PageShell title="Create Mock Test" subtitle="Design a custom test session from your question bank">
      <div className="mb-8">
        {renderStepIndicator()}
      </div>
      
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </PageShell>
  );
}
