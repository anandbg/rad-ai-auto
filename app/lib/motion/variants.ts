// Reusable Framer Motion variants
// Import these for consistent animations across the application

import { type Variants } from 'framer-motion';
import { DURATION, EASE } from './constants';

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASE.out }
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: { duration: DURATION.fast, ease: EASE.in }
  }
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.fast, ease: EASE.out }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: DURATION.fast, ease: EASE.in }
  }
};

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.normal, ease: EASE.out }
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: DURATION.fast, ease: EASE.in }
  }
};

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.normal, ease: EASE.out }
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: DURATION.fast, ease: EASE.in }
  }
};

export const staggerChildren: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};
