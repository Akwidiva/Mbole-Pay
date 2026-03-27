// Reusable Framer Motion animation configurations
export const animationConfig = {
  // Easing curves
  easeSmooth: [0.4, 0, 0.2, 1],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],

  // Durations (in seconds)
  duration: {
    fast: 0.2,
    normal: 0.3,
    slow: 0.4,
  },
}

// Page transition animations
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: animationConfig.duration.normal,
      ease: animationConfig.easeSmooth,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: animationConfig.duration.fast,
      ease: animationConfig.easeSmooth,
    },
  },
}

// Card hover animations
export const cardVariants = {
  initial: {
    y: 0,
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
  },
  hover: {
    y: -8,
    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
    transition: {
      duration: animationConfig.duration.normal,
      ease: animationConfig.easeSmooth,
    },
  },
}

// Button animations
export const buttonVariants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: animationConfig.duration.fast,
      ease: animationConfig.easeSmooth,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: animationConfig.duration.fast,
      ease: animationConfig.easeSmooth,
    },
  },
}

// Container animations (for staggered children)
export const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

// Item animations (for children in container)
export const itemVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: animationConfig.duration.normal,
      ease: animationConfig.easeSmooth,
    },
  },
}

// Scroll reveal animations
export const scrollRevealVariants = {
  initial: {
    opacity: 0,
    y: 40,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: animationConfig.duration.normal,
      ease: animationConfig.easeSmooth,
    },
  },
}

// Icon hover animations
export const iconHoverVariants = {
  rest: {
    scale: 1,
    rotate: 0,
  },
  hover: {
    scale: 1.15,
    rotate: 5,
    transition: {
      duration: animationConfig.duration.fast,
      ease: animationConfig.easeSmooth,
    },
  },
}

// Link underline animation
export const linkUnderlineVariants = {
  initial: { scaleX: 0 },
  hover: {
    scaleX: 1,
    transition: {
      duration: animationConfig.duration.normal,
      ease: animationConfig.easeSmooth,
    },
  },
}

// Loading skeleton animation
export const skeletonVariants = {
  animate: {
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

// Tab transition animation
export const tabPanelVariants = {
  initial: {
    opacity: 0,
    x: 10,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: animationConfig.duration.normal,
      ease: animationConfig.easeSmooth,
    },
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: {
      duration: animationConfig.duration.fast,
      ease: animationConfig.easeSmooth,
    },
  },
}

// List row hover
export const listRowVariants = {
  initial: {
    backgroundColor: "transparent",
  },
  hover: {
    backgroundColor: "rgba(156, 111, 79, 0.05)",
    transition: {
      duration: animationConfig.duration.fast,
      ease: animationConfig.easeSmooth,
    },
  },
}
