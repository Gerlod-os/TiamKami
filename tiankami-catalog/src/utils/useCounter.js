import { useState, useEffect } from "react";

/**
 * Анимированный счётчик от 0 до target
 */
export function useCounter(target, duration = 1000) {
  const [count, setCount] = useState(0);

  // oxlint-ignore-next-line react(set-state-in-effect)
  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }

    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
}
