'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { type ReactNode } from 'react';
import { slideInLeft, slideInRight } from '@/lib/motion/variants';

interface SlideInProps {
  children: ReactNode;
  className?: string;
  direction?: 'left' | 'right';
  delay?: number;
}

export function SlideIn({
  children,
  className,
  direction = 'left',
  delay = 0
}: SlideInProps) {
  const shouldReduceMotion = useReducedMotion();
  const variants = direction === 'left' ? slideInLeft : slideInRight;

  return (
    <motion.div
      variants={variants}
      initial={shouldReduceMotion ? false : 'initial'}
      animate="animate"
      exit={shouldReduceMotion ? undefined : 'exit'}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
