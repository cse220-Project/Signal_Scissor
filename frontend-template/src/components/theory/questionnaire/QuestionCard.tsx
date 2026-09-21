import { useState, useEffect } from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { Question } from './questionsData';

interface QuestionCardProps {
  question: Question;
  onKnowIt: () => void;
  onReviewLater: () => void;
  onNext: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onKnowIt,
  onReviewLater,
  onNext
}) => {
  const [revealed, setRevealed] = useState(false);

  // Reset revealed state when question changes
  useEffect(() => {
    setRevealed(false);
  }, [question.id]);

  const getLevelColor = (level: number) => {
    if (level <= 2) return 'bg-secondary-container text-on-surface';
    if (level <= 4) return 'bg-primary-container text-on-surface';
    if (level <= 6) return 'bg-primary text-on-primary';
    if (level <= 8) return 'bg-surface-container-high text-on-surface';
    return 'bg-error text-on-primary'; // Level 9 Project Defense
  };

  return (
    <Card className="w-full max-w-3xl mx-auto p-6 flex flex-col gap-6 shadow-card transition-all duration-300">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className={`px-3 py-1 rounded-full text-label-caps font-bold ${getLevelColor(question.level)}`}>Level {question.level}: {question.levelName}</span>
        <span className="text-label-caps text-on-surface-variant tracking-wider">
          {question.category}
        </span>
      </div>

      {/* Question */}
      <div className="py-4">
        <h2 className="text-headline-lg text-on-surface font-semibold leading-tight">
          {question.question}
        </h2>
      </div>

      {/* Answer Area */}
      <div
        className={`flex flex-col gap-4 overflow-hidden transition-all duration-500 ease-out ${
          revealed ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant">
          <h3 className="text-title-md text-primary font-bold mb-2">Answer</h3>
          <p className="text-body-lg text-on-surface">{question.answer}</p>
        </div>

        <div className="bg-surface-container-low p-5 rounded-2xl">
          <h3 className="text-title-md text-on-surface font-bold mb-2">Why it matters</h3>
          <p className="text-body-lg text-on-surface-variant">{question.whyItMatters}</p>
        </div>

        <div className="bg-surface-container p-5 rounded-2xl">
          <h3 className="text-title-md text-on-surface font-bold mb-2">Project Connection</h3>
          <code className="block bg-background p-3 rounded-xl text-body-sm text-on-surface font-mono overflow-x-auto">
            {question.projectConnection}
          </code>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-4 items-center justify-between border-t border-outline-variant pt-6">
        {!revealed ? (
          <Button
            onClick={() => setRevealed(true)}
            className="w-full sm:w-auto bg-primary text-on-primary px-8 py-3 rounded-full font-bold hover:opacity-90 transition-opacity"
          >
            Reveal Answer
          </Button>
        ) : (
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <Button
              onClick={onKnowIt}
              className="bg-primary text-on-primary px-6 py-2 rounded-full font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <span>I Know This</span>
              <span>✓</span>
            </Button>
            <Button
              onClick={onReviewLater}
              className="bg-secondary-container text-on-surface px-6 py-2 rounded-full font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <span>Review Later</span>
              <span>⟳</span>
            </Button>
          </div>
        )}

        {revealed && (
          <Button
            onClick={onNext}
            className="w-full sm:w-auto bg-surface-container-high text-on-surface px-6 py-2 rounded-full font-bold hover:bg-surface-container-highest transition-colors ml-auto"
          >
            Next Question →
          </Button>
        )}
      </div>
    </Card>
  );
};

export default QuestionCard;
