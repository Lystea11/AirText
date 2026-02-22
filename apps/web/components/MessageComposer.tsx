'use client';

import { useState, useRef, useEffect } from 'react';

interface MessageComposerProps {
  onSendMessage: (text: string) => void;
  onSendFile?: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

export function MessageComposer({
  onSendMessage,
  onSendFile,
  disabled = false,
  className = '',
}: MessageComposerProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSendMessage(text.trim());
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSendFile) {
      onSendFile(file);
    }
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      <form
        onSubmit={handleSubmit}
        className={`flex items-end border border-stroke-2 bg-surface ${className}`}
      >
        {/* File attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Attach file"
          className="shrink-0 border-r border-stroke px-4 py-4 font-mono text-muted transition-all hover:bg-surface-2 hover:text-parchment disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder={disabled ? 'Awaiting connection...' : 'Type a message...'}
          disabled={disabled}
          rows={1}
          className="max-h-48 flex-1 resize-none bg-transparent px-4 py-4 font-sans text-sm text-parchment placeholder-subtle outline-none disabled:opacity-40"
        />

        <button
          type="submit"
          disabled={disabled || !text.trim()}
          title="Send"
          className="shrink-0 border-l border-stroke bg-surface-2 px-6 py-4 font-mono text-xs uppercase tracking-wider text-muted transition-all hover:bg-lime hover:text-lime-dark hover:border-lime active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </>
  );
}
