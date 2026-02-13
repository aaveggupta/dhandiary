'use client';

import React from 'react';
import {
  ShoppingCart,
  UtensilsCrossed,
  Car,
  Home,
  Receipt,
  ShoppingBag,
  Gamepad2,
  CreditCard,
  Sparkles,
  Heart,
  GraduationCap,
  Shield,
  Plane,
  Gift,
  Wrench,
  MoreHorizontal,
  Briefcase,
  Laptop,
  Building2,
  TrendingUp,
  Award,
  RotateCcw,
  ArrowLeftRight,
  PawPrint,
  Shirt,
  Plus,
  type LucideIcon,
} from 'lucide-react';

/** Single source of truth for category icons - used across CategoryManager, Add Transaction, Transactions list */
export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  ShoppingCart,
  UtensilsCrossed,
  Car,
  Home,
  Receipt,
  ShoppingBag,
  Gamepad2,
  CreditCard,
  Sparkles,
  Heart,
  GraduationCap,
  Shield,
  Plane,
  Gift,
  Wrench,
  MoreHorizontal,
  Briefcase,
  Laptop,
  Building2,
  TrendingUp,
  Award,
  RotateCcw,
  ArrowLeftRight,
  PawPrint,
  Shirt,
  Plus,
};

export const AVAILABLE_CATEGORY_ICONS = Object.keys(CATEGORY_ICON_MAP);

/** Get Lucide icon component for a category's icon name (from DB) */
export function getCategoryIconComponent(iconName?: string | null): LucideIcon {
  if (!iconName || !(iconName in CATEGORY_ICON_MAP)) {
    return MoreHorizontal;
  }
  return CATEGORY_ICON_MAP[iconName];
}

/** React component to render a category icon - works with custom categories from DB */
export function CategoryIcon({
  icon,
  color = '#6b7280',
  size = 18,
  className,
  style,
}: {
  icon?: string | null;
  color?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const IconComponent = getCategoryIconComponent(icon);
  return <IconComponent size={size} className={className} style={{ color, ...style }} />;
}
