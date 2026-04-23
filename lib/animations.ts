import { Variants } from "framer-motion";

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" }
  }
};

export const slideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } 
  },
  exit: { 
    opacity: 0, 
    y: 10,
    transition: { duration: 0.2, ease: "easeIn" }
  }
};

export const cardHover = {
  whileHover: { 
    scale: 1.02,
    boxShadow: "var(--shadow-md)",
    borderColor: "var(--border-strong)"
  },
  whileTap: { scale: 0.98 },
  transition: { type: "spring" as const, stiffness: 400, damping: 17 }
};

export const buttonHover = {
  whileHover: { 
    scale: 1.05,
    filter: "brightness(0.95)"
  },
  whileTap: { scale: 0.95 },
  transition: { type: "spring" as const, stiffness: 500, damping: 15 }
};

export const listItemHover = {
  whileHover: { 
    backgroundColor: "var(--bg-secondary)",
    x: 4
  },
  transition: { type: "tween" as const, duration: 0.2 }
};

export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
};
