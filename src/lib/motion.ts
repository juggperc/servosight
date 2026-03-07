export const appleSpring = {
  type: "spring" as const,
  stiffness: 260,
  damping: 28,
  mass: 0.82,
};

export const softSpring = {
  type: "spring" as const,
  stiffness: 210,
  damping: 26,
  mass: 0.9,
};

export const quickFade = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1] as const,
};

export const fadeUp = {
  initial: { opacity: 0, y: 14, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: 10, filter: "blur(6px)" },
};
