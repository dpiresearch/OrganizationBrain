import React, { useState } from 'react';
import { Send, Microphone } from './icons';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isRecording: boolean;
  onToggleRecording: () => void;
  liveTranscript: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, isRecording, onToggleRecording, liveTranscript }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !isRecording) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const displayValue = isRecording ? liveTranscript : message;
  const placeholderText = isRecording ? "Listening..." : "Ask a follow-up question...";

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-3">
      <textarea
        value={displayValue}
        onChange={(e) => {
            if (!isRecording) {
                setMessage(e.target.value)
            }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !isRecording) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        placeholder={placeholderText}
        className="flex-grow bg-gray-800 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
        rows={1}
        disabled={isLoading}
        readOnly={isRecording}
      />
      <button
        type="button"
        onClick={onToggleRecording}
        disabled={isLoading}
        className={`rounded-full p-3 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        <Microphone className="w-5 h-5" />
      </button>
      <button
        type="submit"
        disabled={isLoading || isRecording || !message.trim()}
        className="bg-indigo-600 text-white rounded-full p-3 hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  );
};