import React from 'react';

interface CreditBadgeProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'subtle' | 'outline' | 'pill';
  showLabel?: boolean;
}

export const CreditBadge: React.FC<CreditBadgeProps> = ({
  amount,
  size = 'md',
  showLabel = true,
}) => {
  const sizeClasses = {
    sm: 'text-[9px] px-2 py-0.5 gap-1',
    md: 'text-[10px] px-2.5 py-1 gap-1.5',
    lg: 'text-xs px-3.5 py-1.5 gap-2 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center font-pixel border-2 border-black bg-amber-400 text-black shadow-[2px_2px_0px_#000] select-none ${sizeClasses[size]}`}
    >
      <span className="text-stone-900 font-bold">🪙</span>
      <span className="font-extrabold">{amount}</span>
      {showLabel && <span className="text-[8px] uppercase tracking-wider">{amount === 1 ? 'COIN' : 'COINS'}</span>}
    </span>
  );
};