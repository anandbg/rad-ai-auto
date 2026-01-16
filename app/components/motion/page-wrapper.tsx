'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { type ReactNode } from 'react';
import { DURATION, EASE } from '@/lib/motion/constants';

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.page, ease: EASE.out }
  }
};

export function PageWrapper({ children, className }: PageWrapperProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={pageVariants}
      initial={shouldReduceMotion ? false : 'initial'}
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
}
