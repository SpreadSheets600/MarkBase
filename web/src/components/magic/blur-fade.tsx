// Magic UI - Blur Fade
import { motion } from "motion/react";
import type { ReactNode } from "react";

export function BlurFade({ children, delay = 0, y = 8, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ delay, duration: 0.45, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
