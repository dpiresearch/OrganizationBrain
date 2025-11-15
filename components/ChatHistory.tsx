
import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { Bot, User, Loader, Volume2, StopCircle } from './icons';

interface ChatHistoryProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isSpeaking: boolean;
  onStopAudio: () => void;
}

const ChatMessageContent: React.FC<{ message: ChatMessage; isSpeaking: boolean; onStopAudio: () => void; }> = ({ message, isSpeaking, onStopAudio }) => {
    // Basic markdown to HTML conversion
    const formatContent = (content: string) => {
        let html = content.replace(/\n/g, '<br />'); // New lines
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>'); // Italic
        return { __html: html };
    };

    if (message.role === 'assistant') {
        return (
            <div className="flex items-start space-x-4">
                <div className="bg-indigo-500 rounded-full p-2">
                    <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 bg-gray-800 p-4 rounded-lg rounded-tl-none">
                    <div className="prose prose-invert max-w-none text-gray-300" dangerouslySetInnerHTML={formatContent(message.content)} />
                    {isSpeaking && <button onClick={onStopAudio} className="mt-3 flex items-center text-sm text-indigo-400 hover:text-indigo-300">
                      <StopCircle className="w-4 h-4 mr-1" /> Stop Audio
                    </button>}
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-start space-x-4 flex-row-reverse">
            <div className="bg-gray-700 rounded-full p-2">
                <User className="w-5 h-5 text-gray-200" />
            </div>
            <div className="flex-1 bg-indigo-800 p-4 rounded-lg rounded-tr-none">
                <p className="text-gray-100">{message.content}</p>
            </div>
        </div>
    );
};


export const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, isLoading, isSpeaking, onStopAudio }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="space-y-6">
      {messages.map((msg, index) => (
        <ChatMessageContent key={index} message={msg} isSpeaking={isSpeaking && index === messages.length -1} onStopAudio={onStopAudio}/>
      ))}
      {isLoading && (
        <div className="flex items-start space-x-4">
          <div className="bg-indigo-500 rounded-full p-2">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 bg-gray-800 p-4 rounded-lg rounded-tl-none flex items-center space-x-2">
            <Loader className="w-5 h-5 animate-spin" />
            <span className="text-gray-400">Analyzing...</span>
          </div>
        </div>
      )}
      <div ref={endOfMessagesRef} />
    </div>
  );
};
