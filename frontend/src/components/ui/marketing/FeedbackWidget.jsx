import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';

export default function FeedbackWidget({ pageId }) {
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = (isHelpful) => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="py-4 px-5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs text-emerald-300 flex items-center gap-2 font-mono-tag">
        <Check className="w-4 h-4 text-emerald-400" />
        <span>Thank you for your feedback!</span>
      </div>
    );
  }

  return (
    <div className="py-4 px-5 rounded-xl border border-border bg-card flex items-center justify-between text-xs text-muted-foreground">
      <span>Was this article helpful?</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleFeedback(true)}
          className="p-1.5 rounded-lg border border-border bg-secondary text-foreground hover:border-emerald-500/40 transition-colors"
          title="Yes, helpful"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleFeedback(false)}
          className="p-1.5 rounded-lg border border-border bg-secondary text-foreground hover:border-rose-500/40 transition-colors"
          title="Not helpful"
        >
          <ThumbsDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

