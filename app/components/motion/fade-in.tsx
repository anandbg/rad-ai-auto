'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { type ReactNode } from 'react';
import { fadeInUp } from '@/lib/motion/variants';

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function FadeIn({ children, className, delay = 0 }: FadeInProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={fadeInUp}
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
