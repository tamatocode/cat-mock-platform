import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Flag, X, Send } from 'lucide-react';
import Button from '../components/ui/Button';
import Timer from '../components/test/Timer';
import QuestionPalette from '../components/test/QuestionPalette';
import QuestionDisplay from '../components/test/QuestionDisplay';
import SubmitModal from '../components/test/SubmitModal';
import { useToast } from '../components/ui/Toast';
import { 
  getTestById, getQuestionsByIds, saveAttempt, 
  saveInProgressTest, getInProgressTest, clearInProgressTest 
} from '../lib/storage';
import { generateId, cn } from '../lib/utils';
import { scoreTest } from '../lib/scoring';

export default function TestInterface() {
  const { id: testId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [test, setTest] = useState(null);
  const [questionsMap, setQuestionsMap] = useState(new Map());
  
  // Test State
  const [attemptId] = useState(() => generateId());
  const [startTime] = useState(() => Date.now());
  const [responses, setResponses] = useState({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Timer & UI State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Refs for auto-save and timing
  const responsesRef = useRef(responses);
  const timerRef = useRef(null);
  const questionEnterTimeRef = useRef(Date.now());
  const currentSectionIndexRef = useRef(currentSectionIndex);
  const currentQuestionIndexRef = useRef(currentQuestionIndex);

  // Sync refs
  useEffect(() => { responsesRef.current = responses; }, [responses]);
  useEffect(() => { currentSectionIndexRef.current = currentSectionIndex; }, [currentSectionIndex]);
  useEffect(() => { currentQuestionIndexRef.current = currentQuestionIndex; }, [currentQuestionIndex]);

  // Load Test Data
  useEffect(() => {
    const t = getTestById(testId);
    if (!t) {
      toast.error('Test not found');
      navigate('/tests');
      return;
    }
    
    // Check for in-progress test
    const inProgress = getInProgressTest();
    let initialResponses = {};
    
    if (inProgress && inProgress.testId === testId) {
      if (window.confirm('Resume your previous in-progress attempt?')) {
        initialResponses = inProgress.responses || {};
        setCurrentSectionIndex(inProgress.currentSectionIndex || 0);
        setCurrentQuestionIndex(inProgress.currentQuestionIndex || 0);
      } else {
        clearInProgressTest();
      }
    }
    
    setTest(t);
    
    const allQIds = t.sections.flatMap(s => s.questionIds);
    const qs = getQuestionsByIds(allQIds);
    const qMap = new Map(qs.map(q => [q.id, q]));
    setQuestionsMap(qMap);

    // Initialize missing responses
    const newResponses = { ...initialResponses };
    allQIds.forEach(qId => {
      if (!newResponses[qId]) {
        newResponses[qId] = {
          selectedOption: null,
          typedAnswer: null,
          timeTaken: 0,
          visitCount: 0,
          status: 'not-visited'
        };
      }
    });
    
    // Visit first question
    const firstQId = t.sections[0].questionIds[0];
    if (newResponses[firstQId].status === 'not-visited') {
      newResponses[firstQId].status = 'not-answered';
    }
    newResponses[firstQId].visitCount += 1;
    
    setResponses(newResponses);
    setIsInitialized(true);
    questionEnterTimeRef.current = Date.now();

    // Prevent accidental leave
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [testId, navigate, toast]);

  // Auto-save loop
  useEffect(() => {
    if (!isInitialized) return;
    const intervalId = setInterval(() => {
      saveInProgressTest({
        testId,
        attemptId,
        responses: responsesRef.current,
        currentSectionIndex: currentSectionIndexRef.current,
        currentQuestionIndex: currentQuestionIndexRef.current,
        savedAt: Date.now()
      });
    }, 30000);
    return () => clearInterval(intervalId);
  }, [isInitialized, testId, attemptId]);

  // Track Time & Visit Logic
  const recordTimeAndVisit = useCallback((targetSectionIdx, targetQuestionIdx) => {
    const now = Date.now();
    const timeSpentOnCurrent = Math.floor((now - questionEnterTimeRef.current) / 1000);
    
    setResponses(prev => {
      if (!test) return prev;
      
      const next = { ...prev };
      
      // Accumulate time for current question
      const currentQId = test.sections[currentSectionIndexRef.current].questionIds[currentQuestionIndexRef.current];
      next[currentQId] = {
        ...next[currentQId],
        timeTaken: (next[currentQId]?.timeTaken || 0) + timeSpentOnCurrent
      };
      
      // Update status if it's still 'not-visited' (failsafe)
      if (next[currentQId].status === 'not-visited') {
        next[currentQId].status = 'not-answered';
      }

      // Record visit for target question
      const targetQId = test.sections[targetSectionIdx].questionIds[targetQuestionIdx];
      next[targetQId] = {
        ...next[targetQId],
        visitCount: (next[targetQId]?.visitCount || 0) + 1,
        status: next[targetQId]?.status === 'not-visited' ? 'not-answered' : next[targetQId]?.status
      };
      
      return next;
    });

    questionEnterTimeRef.current = now;
  }, [test]);

  // Navigation Handlers
  const handleJump = useCallback((sIdx, qIdx) => {
    recordTimeAndVisit(sIdx, qIdx);
    setCurrentSectionIndex(sIdx);
    setCurrentQuestionIndex(qIdx);
  }, [recordTimeAndVisit]);

  const handleNext = useCallback(() => {
    if (!test) return;
    const currentSection = test.sections[currentSectionIndex];
    
    if (currentQuestionIndex < currentSection.questionIds.length - 1) {
      handleJump(currentSectionIndex, currentQuestionIndex + 1);
    } else if (currentSectionIndex < test.sections.length - 1) {
      // Auto-advance to next section
      handleJump(currentSectionIndex + 1, 0);
    }
  }, [test, currentSectionIndex, currentQuestionIndex, handleJump]);

  const handlePrev = useCallback(() => {
    if (!test) return;
    if (currentQuestionIndex > 0) {
      handleJump(currentSectionIndex, currentQuestionIndex - 1);
    } else if (currentSectionIndex > 0) {
      const prevSection = test.sections[currentSectionIndex - 1];
      handleJump(currentSectionIndex - 1, prevSection.questionIds.length - 1);
    }
  }, [test, currentSectionIndex, currentQuestionIndex, handleJump]);

  // Answer Handlers
  const currentQId = useMemo(() => {
    if (!test) return null;
    return test.sections[currentSectionIndex].questionIds[currentQuestionIndex];
  }, [test, currentSectionIndex, currentQuestionIndex]);

  const currentQuestion = useMemo(() => {
    return currentQId ? questionsMap.get(currentQId) : null;
  }, [currentQId, questionsMap]);

  const currentResponse = useMemo(() => {
    return currentQId ? responses[currentQId] : null;
  }, [currentQId, responses]);

  const updateResponse = useCallback((updates) => {
    if (!currentQId) return;
    setResponses(prev => {
      const next = { ...prev };
      const res = next[currentQId];
      
      const newRes = { ...res, ...updates };
      
      // Determine new status based on data
      const hasAnswer = newRes.selectedOption !== null || (newRes.typedAnswer !== null && newRes.typedAnswer !== '');
      const isMarked = newRes.status?.includes('marked');
      
      if (hasAnswer && isMarked) newRes.status = 'answered-and-marked';
      else if (hasAnswer) newRes.status = 'answered';
      else if (isMarked) newRes.status = 'marked-for-review';
      else newRes.status = 'not-answered';
      
      next[currentQId] = newRes;
      return next;
    });
  }, [currentQId]);

  const handleSelectOption = useCallback((optId) => {
    if (!currentResponse) return;
    const newOpt = currentResponse.selectedOption === optId ? null : optId;
    updateResponse({ selectedOption: newOpt });
  }, [currentResponse, updateResponse]);

  const handleTypeAnswer = useCallback((val) => {
    updateResponse({ typedAnswer: val });
  }, [updateResponse]);

  const handleClear = useCallback(() => {
    updateResponse({ selectedOption: null, typedAnswer: '' });
  }, [updateResponse]);

  const handleMarkForReview = useCallback(() => {
    if (!currentResponse) return;
    const isCurrentlyMarked = currentResponse.status.includes('marked');
    const hasAnswer = currentResponse.selectedOption !== null || (currentResponse.typedAnswer !== null && currentResponse.typedAnswer !== '');
    
    let newStatus;
    if (isCurrentlyMarked) {
      newStatus = hasAnswer ? 'answered' : 'not-answered';
    } else {
      newStatus = hasAnswer ? 'answered-and-marked' : 'marked-for-review';
    }
    
    setResponses(prev => ({
      ...prev,
      [currentQId]: { ...prev[currentQId], status: newStatus }
    }));
  }, [currentQId, currentResponse]);

  const handleSaveAndNext = useCallback(() => {
    // Save logic is implicit in state updates and auto-save
    handleNext();
  }, [handleNext]);

  // Submission
  const handleSubmitConfirm = () => {
    // Record final time for current question
    const now = Date.now();
    const timeSpentOnCurrent = Math.floor((now - questionEnterTimeRef.current) / 1000);
    
    const finalResponses = { ...responsesRef.current };
    if (currentQId) {
      finalResponses[currentQId] = {
        ...finalResponses[currentQId],
        timeTaken: (finalResponses[currentQId]?.timeTaken || 0) + timeSpentOnCurrent
      };
    }

    const allQsArray = Array.from(questionsMap.values());
    const score = scoreTest(test, allQsArray, finalResponses);
    
    const endTime = Date.now();
    
    const attempt = {
      id: attemptId,
      testId: test.id,
      startTime,
      endTime,
      timeTaken: Math.floor((endTime - startTime) / 1000),
      responses: finalResponses,
      score
    };

    saveAttempt(attempt);
    clearInProgressTest();
    
    toast.success('Test submitted successfully!');
    navigate(`/result/${attempt.id}`);
  };

  const getSummary = () => {
    let answered = 0, unattempted = 0, marked = 0;
    const total = Array.from(questionsMap.keys()).length;
    
    Object.values(responses).forEach(r => {
      if (r.status === 'answered' || r.status === 'answered-and-marked') answered++;
      if (r.status === 'not-visited' || r.status === 'not-answered') unattempted++;
      if (r.status.includes('marked')) marked++;
    });
    
    return { answered, unattempted, marked, total };
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showSubmitModal) return;
      
      // Ignore if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch(e.key.toLowerCase()) {
        case 'n': case 'arrowright': handleNext(); break;
        case 'p': case 'arrowleft': handlePrev(); break;
        case 'm': handleMarkForReview(); break;
        case 'c': handleClear(); break;
        case '1': if (currentQuestion?.type === 'MCQ') handleSelectOption('A'); break;
        case '2': if (currentQuestion?.type === 'MCQ') handleSelectOption('B'); break;
        case '3': if (currentQuestion?.type === 'MCQ') handleSelectOption('C'); break;
        case '4': if (currentQuestion?.type === 'MCQ') handleSelectOption('D'); break;
        default: break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSubmitModal, currentQuestion, handleNext, handlePrev, handleMarkForReview, handleClear, handleSelectOption]);

  if (!isInitialized || !test || !currentQuestion) return null;

  const currentSection = test.sections[currentSectionIndex];

  return (
    <div className="flex flex-col h-screen bg-bg overflow-hidden font-sans">
      
      {/* Top Bar */}
      <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="font-bold text-white truncate max-w-[200px] md:max-w-[300px]">
          {test.name}
        </div>
        
        {/* Top bar section tabs (desktop only) */}
        <div className="hidden md:flex h-full">
          {test.sections.map((sec, idx) => (
            <button
              key={sec.name}
              onClick={() => handleJump(idx, 0)}
              className={cn(
                "px-6 h-full font-medium text-sm transition-colors border-b-2",
                currentSectionIndex === idx 
                  ? "text-accent border-accent bg-surface-active" 
                  : "text-text-secondary border-transparent hover:text-white hover:bg-surface-hover"
              )}
            >
              {sec.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <Timer 
            ref={timerRef} 
            totalSeconds={test.duration * 60} 
            onTimeUp={handleSubmitConfirm} 
            isWarning={true} 
          />
          <Button variant="danger" size="sm" onClick={() => setShowSubmitModal(true)}>
            <Send size={16} className="mr-2" /> Submit
          </Button>
        </div>
      </header>

      {/* Main Area */}
      <div className="flex flex-1 min-h-0 relative">
        
        {/* Left: Question + Actions */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 min-h-0 relative">
            <QuestionDisplay
              question={currentQuestion}
              response={currentResponse}
              onSelectOption={handleSelectOption}
              onTypeAnswer={handleTypeAnswer}
              questionNumber={currentQuestionIndex + 1}
              totalInSection={currentSection.questionIds.length}
              sectionName={currentSection.name}
            />
          </div>

          {/* Bottom Action Bar */}
          <div className="h-16 md:h-20 bg-surface border-t border-border flex items-center justify-between px-4 md:px-6 shrink-0">
            <div className="flex gap-2 md:gap-4">
              <Button variant="ghost" onClick={handleClear} className="hidden md:flex">
                <X size={16} className="mr-2" /> Clear Response
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleMarkForReview}
                className={cn(currentResponse?.status.includes('marked') && "border-status-marked text-status-marked bg-status-marked/10")}
              >
                <Flag size={16} className="md:mr-2" /> <span className="hidden md:inline">Mark for Review</span>
              </Button>
            </div>
            
            <div className="flex gap-2 md:gap-4">
              <Button variant="secondary" onClick={handlePrev}>
                <ChevronLeft size={18} className="md:mr-1" /> <span className="hidden md:inline">Previous</span>
              </Button>
              <Button variant="primary" onClick={handleSaveAndNext} className="shadow-glow px-4 md:px-8">
                <span className="hidden md:inline">Save & Next</span> <span className="md:hidden">Next</span> <ChevronRight size={18} className="ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Question Palette (Desktop) */}
        <div className="hidden lg:block w-72 shrink-0 h-full">
          <QuestionPalette
            sections={test.sections}
            responses={responses}
            currentSectionIndex={currentSectionIndex}
            currentQuestionIndex={currentQuestionIndex}
            onJump={handleJump}
            onSectionChange={(idx) => handleJump(idx, 0)}
          />
        </div>
      </div>

      <SubmitModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={handleSubmitConfirm}
        summary={getSummary()}
      />
    </div>
  );
}
