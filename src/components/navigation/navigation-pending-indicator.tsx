import * as React from "react";
import { useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const NAVIGATION_INDICATOR_DELAY_MS = 75;

export function useNavigationPendingState() {
  const state = useRouterState({
    select: (routerState) => ({
      isLoading: routerState.isLoading || routerState.status === "pending",
      pendingPath:
        routerState.pendingMatches?.[routerState.pendingMatches.length - 1]?.fullPath ?? null,
    }),
    structuralSharing: true,
  });
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (!state.isLoading) {
      setIsVisible(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsVisible(true);
    }, NAVIGATION_INDICATOR_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [state.isLoading]);

  return {
    isNavigating: state.isLoading,
    isVisible,
    pendingPath: state.pendingPath,
  };
}

export function NavigationPendingIndicator({
  className,
}: {
  className?: string;
}) {
  const { isVisible } = useNavigationPendingState();

  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-0.5 overflow-hidden rounded-full bg-primary/10 transition-opacity duration-200",
          isVisible ? "opacity-100" : "opacity-0",
          className
        )}
      >
        <div className="navigation-progress-bar h-full w-2/5 rounded-full bg-primary" />
      </div>
      <p aria-live="polite" className="sr-only">
        {isVisible ? "Loading page" : ""}
      </p>
    </>
  );
}

