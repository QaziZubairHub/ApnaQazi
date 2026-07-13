import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const AnimatedCounter = ({ value, prefix = "", suffix = "", duration = 1.2, decimals = 0 }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const target = typeof value === "number" ? value : 0;
    let startTime = null;
    let raf;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(eased * target);
      if (progress < 1) raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, isInView]);

  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : Math.round(display).toLocaleString();

  return (
    <motion.span ref={ref} className="tabular-nums">
      {prefix}{formatted}{suffix}
    </motion.span>
  );
};

export default AnimatedCounter;
