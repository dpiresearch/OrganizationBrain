import React from 'react';
import type { StructuredInsight } from '../types';
import { TrendingUp, CheckCircle, AlertTriangle, Wand } from './icons';

interface StructuredResponseProps {
  insight: StructuredInsight;
}

const InsightSection: React.FC<{ title: string; items: string[]; icon: React.ReactNode; className: string }> = ({ title, items, icon, className }) => {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h4 className={`flex items-center text-sm font-semibold mb-2 ${className}`}>
        {icon}
        {title}
      </h4>
      <ul className="list-disc list-inside space-y-1 text-sm text-gray-400">
        {items.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    </div>
  );
};

export const StructuredResponse: React.FC<StructuredResponseProps> = ({ insight }) => {
  const confidenceColor = insight.confidence && insight.confidence >= 75 ? 'text-green-400'
    : insight.confidence && insight.confidence >= 50 ? 'text-yellow-400'
    : 'text-red-400';

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-md text-white">{insight.title}</h3>
        {insight.confidence !== undefined && (
          <div className={`flex items-center font-bold text-sm px-2 py-1 rounded-full ${confidenceColor} bg-gray-900/50`}>
            <TrendingUp className="w-4 h-4 mr-1" />
            {insight.confidence}% Confidence
          </div>
        )}
      </div>
      <p className="text-sm text-gray-300 mb-4 italic">"{insight.summary}"</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InsightSection 
          title="Key Reasons" 
          items={insight.reasons} 
          icon={<CheckCircle className="w-4 h-4 mr-2" />}
          className="text-green-400"
        />
        <InsightSection 
          title="Risk Factors" 
          items={insight.risks || []} 
          icon={<AlertTriangle className="w-4 h-4 mr-2" />}
          className="text-yellow-400"
        />
        <InsightSection 
          title="Recommended Actions" 
          items={insight.actions || []} 
          icon={<Wand className="w-4 h-4 mr-2" />}
          className="text-indigo-400"
        />
      </div>
    </div>
  );
};