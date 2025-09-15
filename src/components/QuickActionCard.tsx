import React from 'react';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon,
  onClick,
  gradientFrom,
  gradientTo,
  borderColor,
}) => {
  return (
    <button
      onClick={onClick}
      className={`group bg-gradient-to-r ${gradientFrom}/20 ${gradientTo}/20 hover:${gradientFrom}/30 hover:${gradientTo}/30 backdrop-blur-sm rounded-2xl p-8 border ${borderColor}/30 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl text-left`}
    >
      <div className="flex items-center gap-6">
        <div className={`w-16 h-16 bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {title}
          </h3>
          <p className="text-white/70 text-sm leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
};

export default QuickActionCard;
