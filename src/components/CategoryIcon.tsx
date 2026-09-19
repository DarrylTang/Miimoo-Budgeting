'use client';

import React from 'react';
import {
  UtensilsCrossed,
  ShoppingCart,
  Zap,
  Sparkles,
  Home,
  HeartPulse,
  Car,
  Shirt,
  GraduationCap,
  ShoppingBag,
  BadgeDollarSign,
  Coins,
  Gift,
  ArrowRightLeft,
  Tag,
  CreditCard,
  Wallet,
  Coffee,
  Plane,
  Briefcase,
  Smartphone,
  BookOpen,
  Music,
  Shield,
  HelpCircle,
  LucideProps,
} from 'lucide-react';

interface CategoryIconProps extends LucideProps {
  name: string;
}

const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  UtensilsCrossed,
  ShoppingCart,
  Zap,
  Sparkles,
  Home,
  HeartPulse,
  Car,
  Shirt,
  GraduationCap,
  ShoppingBag,
  BadgeDollarSign,
  Coins,
  Gift,
  ArrowRightLeft,
  Tag,
  CreditCard,
  Wallet,
  Coffee,
  Plane,
  Briefcase,
  Smartphone,
  BookOpen,
  Music,
  Shield,
  HelpCircle,
};

export function CategoryIcon({ name, ...props }: CategoryIconProps) {
  const IconComponent = ICON_MAP[name] || Tag;
  return <IconComponent {...props} />;
}
