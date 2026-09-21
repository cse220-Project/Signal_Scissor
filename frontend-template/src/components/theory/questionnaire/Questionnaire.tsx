import { useState, useMemo, useEffect, useRef } from 'react';
import { questions } from './questionsData';
import { QuestionCard } from './QuestionCard';
import Button from '../../../components/ui/Button';
;

type Mode = 'sequential' | 'random';

export default function Questionnaire() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredIds, setAnsweredIds] = useState<Set<number>>(new Set());
  const [reviewLaterIds, setReviewLaterIds] = useState<Set<number>>(new Set());
  
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>('sequential');
  
  // Animation/Observer refs
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  // Filtering questions
  const filteredQuestions = useMemo(() => {
    let filtered = questions;
    if (selectedLevel !== null) {
      filtered = filtered.filter(q => q.level === selectedLevel);
    }
    
    if (mode === 'random') {
      // Create a shuffled copy
      return [...filtered].sort(() => Math.random() - 0.5);
    }
    return filtered;
  }, [selectedLevel, mode]);

  // Derived state
  const total = filteredQuestions.length;
  const currentQuestion = filteredQuestions[currentIndex];
  
  const knownCount = useMemo(() => {
    return filteredQuestions.filter(q => answeredIds.has(q.id)).length;
  }, [filteredQuestions, answeredIds]);
  
  const reviewCount = useMemo(() => {
    return filteredQuestions.filter(q => reviewLaterIds.has(q.id)).length;
  }, [filteredQuestions, reviewLaterIds]);
  
  const isFinished = currentIndex >= total && total > 0;

  // Actions
  const handleNext = () => {
    if (currentIndex < total) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleKnowIt = () => {
    if (currentQuestion) {
      setAnsweredIds(prev => {
        const next = new Set(prev);
        next.add(currentQuestion.id);
        return next;
      });
      setReviewLaterIds(prev => {
        const next = new Set(prev);
        next.delete(currentQuestion.id);
        return next;
      });
      handleNext();
    }
  };

  const handleReviewLater = () => {
    if (currentQuestion) {
      setReviewLaterIds(prev => {
        const next = new Set(prev);
        next.add(currentQuestion.id);
        return next;
      });
      setAnsweredIds(prev => {
        const next = new Set(prev);
        next.delete(currentQuestion.id);
        return next;
      });
      handleNext();
    }
  };

  const resetProgress = () => {
    setCurrentIndex(0);
    setAnsweredIds(new Set());
    setReviewLaterIds(new Set());
  };


  return (
    <div ref={containerRef} className="w-full max-w-5xl mx-auto py-8 px-4 flex flex-col gap-8 min-h-[80vh]">
      
      {/* Header Info */}
      <div className="text-center flex flex-col gap-2">
        <h1 className="text-display text-on-surface font-extrabold tracking-tight">Can You Explain the DSP?</h1>
        <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          A comprehensive viva-style questionnaire covering all concepts in this project.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-low p-4 rounded-3xl flex flex-wrap gap-4 items-center justify-between shadow-sm border border-outline-variant">
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-label-caps text-on-surface-variant mr-2">Level:</span>
          <Button 
            onClick={() => { setSelectedLevel(null); setCurrentIndex(0); }}
            className={`px-4 py-2 rounded-full text-body-sm font-bold transition-colors ${selectedLevel === null ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'}`}
          >
            All
          </Button>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
            <Button
              key={level}
              onClick={() => { setSelectedLevel(level); setCurrentIndex(0); }}
              className={`px-3 py-2 rounded-full text-body-sm font-bold transition-colors ${selectedLevel === level ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'}`}
            >
              L{level}
            </Button>
          ))}
        </div>
        
        <div className="flex gap-2 items-center">
           <span className="text-label-caps text-on-surface-variant mr-2">Mode:</span>
           <select 
             className="bg-surface-container-high text-on-surface px-4 py-2 rounded-xl text-body-sm font-bold outline-none border-none cursor-pointer"
             value={mode}
             onChange={(e) => { setMode(e.target.value as Mode); setCurrentIndex(0); }}
           >
             <option value="sequential">Sequential</option>
             <option value="random">Random</option>
           </select>
        </div>
      </div>

      {/* Content Area */}
      {total === 0 ? (
        <div className="bg-surface-container p-12 rounded-3xl text-center shadow-card border border-outline-variant">
          <h3 className="text-headline-lg text-on-surface mb-2">No Questions Found</h3>
          <p className="text-body-lg text-on-surface-variant">Try selecting a different filter.</p>
        </div>
      ) : isFinished ? (
        <div className="bg-surface-container-lowest p-12 rounded-3xl text-center shadow-card border border-outline-variant flex flex-col gap-6 max-w-2xl mx-auto">
          <h2 className="text-headline-lg text-primary font-bold">Session Complete!</h2>
          
          <div className="flex justify-center gap-8 py-6">
            <div className="flex flex-col items-center">
              <span className="text-display text-on-surface font-black">{total}</span>
              <span className="text-label-caps text-on-surface-variant">Total</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-display text-primary font-black">{knownCount}</span>
              <span className="text-label-caps text-on-surface-variant">Known</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-display text-error font-black">{reviewCount}</span>
              <span className="text-label-caps text-on-surface-variant">Review</span>
            </div>
          </div>

          <div className="flex justify-center gap-4 flex-wrap">
            <Button onClick={resetProgress} className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold">
              Restart Session
            </Button>
            {reviewCount > 0 && (
               <Button onClick={() => setCurrentIndex(0)} className="bg-secondary-container text-on-surface px-8 py-3 rounded-full font-bold">
                 Review Again
               </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 w-full items-center">
          {/* Progress */}
          <div className="w-full max-w-3xl flex flex-col gap-2">
            <div className="flex justify-between text-body-sm font-bold text-on-surface-variant">
              <span>Question {currentIndex + 1} of {total}</span>
              <div className="flex gap-4">
                <span className="text-primary">Known: {knownCount}</span>
                <span className="text-error">Review: {reviewCount}</span>
              </div>
            </div>
            {/* Inline progress bar if ProgressBar not well-defined */}
            <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
               <div 
                 className="h-full bg-primary transition-all duration-300"
                 style={{ width: `${((currentIndex) / total) * 100}%` }}
               />
            </div>
          </div>

          {/* Question Card */}
          {isVisible && currentQuestion && (
            <QuestionCard 
              question={currentQuestion}
              onKnowIt={handleKnowIt}
              onReviewLater={handleReviewLater}
              onNext={handleNext}
            />
          )}

          {/* Simple Navigation */}
          <div className="w-full max-w-3xl flex justify-between mt-4">
            <Button 
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className={`px-6 py-2 rounded-full font-bold transition-opacity ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed bg-surface-container-high text-on-surface-variant' : 'bg-surface-container-highest text-on-surface hover:bg-surface-container'}`}
            >
              ← Previous
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
