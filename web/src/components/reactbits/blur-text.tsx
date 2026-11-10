// React Bits - Blur Text
import { motion } from "motion/react";

export function BlurText({ text, delay = 0.06, className }: { text: string; delay?: number; className?: string }) {
  return (
    <span className={className} aria-label={text}>
      {text.split(" ").map((w, i) => (
        <motion.span key={i} aria-hidden className="inline-block will-change-transform"
          initial={{ filter: "blur(10px)", opacity: 0, y: 14 }}
          animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
          transition={{ delay: i * delay, duration: 0.6, ease: "easeOut" }}>
          {w}&nbsp;
        </motion.span>
      ))}
    </span>
  );
}
