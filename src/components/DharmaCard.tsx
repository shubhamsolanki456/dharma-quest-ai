import { ReactNode } from 'react';
import { Card } from './ui/card';

interface DharmaCardProps {
  children: ReactNode;
  className?: string;
  gradient?: 'saffron' | 'spiritual' | 'lotus' | 'dharma' | 'sunrise';
  glow?: boolean;
}

export const DharmaCard = ({ 
  children, 
  className = '', 
  gradient,
  glow = false 
}: DharmaCardProps) => {
  const gradientClass = gradient ? `bg-gradient-${gradient}` : '';
  const glowClass = glow ? 'shadow-saffron' : '';
  
  return (
    <Card className={`${gradientClass} ${glowClass} transition-spiritual hover:scale-[1.02] ${className}`}>
      {children}
    </Card>
  );
};