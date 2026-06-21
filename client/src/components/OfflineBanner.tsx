import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * OfflineBanner — shows a non-intrusive banner at the top of the viewport
 * when the browser loses network connectivity, and auto-dismisses when
 * connectivity is restored.
 *
 * Uses the `navigator.onLine` property for the initial state and the
 * `online` / `offline` window events for live updates.
 */
export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState<boolean>(() => !navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-500 text-yellow-950 text-sm font-medium shadow-md"
    >
      <WifiOff size={15} className="flex-shrink-0" />
      <span>You are offline. Some features may be unavailable.</span>
    </div>
  );
}
