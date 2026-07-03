import { useEffect } from "react";

// Module-level counter shared across all hook instances.
// Prevents premature scroll restoration when multiple modals are open.
let lockCount = 0;
let previousOverflow = null;

export default function useBodyScrollLock(isLocked) {
  useEffect(() => {
    if (isLocked) {
      if (lockCount === 0) {
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
      }
      lockCount++;
    }

    return () => {
      if (isLocked) {
        lockCount--;
        if (lockCount <= 0) {
          document.body.style.overflow = previousOverflow || "";
          previousOverflow = null;
          lockCount = 0;
        }
      }
    };
  }, [isLocked]);
}
