"use client";

import * as m from "framer-motion/m";

type RevealProps = {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
};

/** Fade + rise into view once. Respects reduced-motion via MotionConfig. */
export function Reveal({ children, delay = 0, y = 24, className }: RevealProps) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.6, 0.35, 1] }}
    >
      {children}
    </m.div>
  );
}
