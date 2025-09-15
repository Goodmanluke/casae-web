import React from 'react';
import { useRouter } from 'next/router';
import QuickActionCard from './QuickActionCard';

interface QuickActionsProps {
  onSubscribe: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onSubscribe }) => {
  const router = useRouter();

  const quickActions = [
    {
      title: "Start New CMA",
      description: "Create a comprehensive market analysis",
      onClick: () => router.push("/cma"),
      gradientFrom: "from-cyan-500",
      gradientTo: "to-blue-600",
      borderColor: "border-cyan-400",
      icon: (
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      title: "Browse Properties",
      description: "View your property database",
      onClick: () => router.push("/properties"),
      gradientFrom: "from-purple-500",
      gradientTo: "to-pink-600",
      borderColor: "border-purple-400",
      icon: (
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
    },
    {
      title: "Upgrade Plan",
      description: "Unlock premium features",
      onClick: onSubscribe,
      gradientFrom: "from-emerald-500",
      gradientTo: "to-teal-600",
      borderColor: "border-emerald-400",
      icon: (
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="mt-12">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-8 text-left">
          Quick Actions
        </h2>
        <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
          {quickActions.map((action, index) => (
            <QuickActionCard
              key={index}
              title={action.title}
              description={action.description}
              icon={action.icon}
              onClick={action.onClick}
              gradientFrom={action.gradientFrom}
              gradientTo={action.gradientTo}
              borderColor={action.borderColor}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
