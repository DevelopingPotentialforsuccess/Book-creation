
import React from 'react';

interface LoadingSpinnerProps {
  progress: number;
  message: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ progress, message }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative inline-flex items-center justify-center">
        <svg className="w-48 h-48 transform -rotate-90">
          <circle
            className="text-slate-200"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="96"
            cy="96"
          />
          <circle
            className="text-blue-500 transition-all duration-500 ease-out"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="96"
            cy="96"
          />
        </svg>
        <span className="absolute text-3xl font-bold text-slate-800">{progress}%</span>
      </div>
      <p className="mt-6 text-lg font-medium text-slate-600 animate-pulse">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
