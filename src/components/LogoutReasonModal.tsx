import { useState, useRef, useEffect } from 'react';

interface LogoutReasonModalProps {
  onSubmit: (reason: string) => void;
}

export default function LogoutReasonModal({ onSubmit }: LogoutReasonModalProps) {
  const [reason, setReason] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-md"
      onKeyDown={handleKeyDown}
    >
      <div className="glass-panel p-stack-lg flex flex-col gap-stack-md w-full max-w-md mx-4">
        <h2 className="text-headline-md font-headline-md text-on-surface tracking-tight">
          Session Termination
        </h2>
        <p className="text-body-md font-body-md text-on-surface-variant">
          Please provide a reason for terminating this session. This action
          cannot be completed without a reason.
        </p>
        <div className="flex flex-col gap-unit">
          <label
            htmlFor="logout-reason"
            className="font-label-sm text-label-sm text-on-surface-variant"
          >
            Reason for Logout
          </label>
          <textarea
            ref={textareaRef}
            id="logout-reason"
            className="w-full bg-surface-container-lowest border border-outline-variant px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-outline-variant transition-all hover:border-primary/50 focus:outline-none focus:border-primary focus:ring-0 resize-none min-h-[100px]"
            placeholder="Enter the reason for logging out..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') e.preventDefault();
            }}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!reason.trim()}
          className={`w-full py-4 font-label-md text-label-md font-bold tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
            reason.trim()
              ? 'bg-primary text-on-primary hover:brightness-110 active:scale-[0.98]'
              : 'bg-outline-variant/40 text-on-surface-variant/50 cursor-not-allowed'
          }`}
        >
          SUBMIT REASON & TERMINATE
          <span className="material-symbols-outlined text-[18px]">logout</span>
        </button>
      </div>
    </div>
  );
}
