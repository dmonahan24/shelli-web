import * as React from "react";
import { useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const NAVIGATION_ACKNOWLEDGEMENT_MIN_MS = 180;

type NavigationIntent = {
  href: string | null;
  id: number;
  preload: string | null;
  source: "anchor" | "programmatic";
  startedAt: number;
};

type NavigationDebugState = "cache-hit" | "loader-running" | "preloaded";

type NavigationIntentMetadata = {
  href?: string | null;
  preload?: string | null;
  source?: NavigationIntent["source"];
};

let navigationIntentId = 0;
let navigationIntentSnapshot: NavigationIntent | null = null;
const navigationIntentListeners = new Set<() => void>();

function emitNavigationIntentChange() {
  for (const listener of navigationIntentListeners) {
    listener();
  }
}

function subscribeToNavigationIntent(listener: () => void) {
  navigationIntentListeners.add(listener);
  return () => {
    navigationIntentListeners.delete(listener);
  };
}

function getNavigationIntentSnapshot() {
  return navigationIntentSnapshot;
}

export function acknowledgeNavigation(metadata: NavigationIntentMetadata = {}) {
  if (typeof window === "undefined") {
    return;
  }

  navigationIntentId += 1;
  navigationIntentSnapshot = {
    href: metadata.href ?? null,
    id: navigationIntentId,
    preload: metadata.preload ?? null,
    source: metadata.source ?? "programmatic",
    startedAt: window.performance.now(),
  };
  emitNavigationIntentChange();
}

function getInternalNavigationIntent(anchor: HTMLAnchorElement) {
  if (anchor.target && anchor.target !== "_self") {
    return null;
  }

  if (anchor.hasAttribute("download")) {
    return null;
  }

  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#")) {
    return null;
  }

  const destination = new URL(anchor.href, window.location.href);
  const current = new URL(window.location.href);

  if (destination.origin !== current.origin) {
    return null;
  }

  const destinationHref = `${destination.pathname}${destination.search}${destination.hash}`;
  const currentHref = `${current.pathname}${current.search}${current.hash}`;

  if (destinationHref === currentHref) {
    return null;
  }

  return {
    href: destinationHref,
    preload: anchor.dataset.navigationPreload ?? null,
  };
}

function useNavigationIntentCapture() {
  React.useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.altKey ||
        event.ctrlKey ||
        event.shiftKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      const intent = getInternalNavigationIntent(anchor);
      if (!intent) {
        return;
      }

      acknowledgeNavigation({
        href: intent.href,
        preload: intent.preload,
        source: "anchor",
      });
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, []);
}

export function useShellNavigationFeedback() {
  useNavigationIntentCapture();

  const routerState = useRouterState({
    select: (state) => ({
      isSlowNavigation: state.isLoading || state.status === "pending",
      pendingPath:
        state.pendingMatches?.[state.pendingMatches.length - 1]?.fullPath ?? state.location.pathname,
    }),
    structuralSharing: true,
  });
  const navigationIntent = React.useSyncExternalStore(
    subscribeToNavigationIntent,
    getNavigationIntentSnapshot,
    getNavigationIntentSnapshot
  );
  const [isIntentActive, setIsIntentActive] = React.useState(false);
  const [isAcknowledgingNavigation, setIsAcknowledgingNavigation] = React.useState(false);
  const acknowledgementStartedAtRef = React.useRef<number | null>(null);
  const acknowledgementTimeoutRef = React.useRef<number | null>(null);
  const navigationSessionRef = React.useRef<{
    href: string | null;
    preload: string | null;
    sawSlowNavigation: boolean;
    startedAt: number;
  } | null>(null);

  React.useEffect(() => {
    if (!navigationIntent) {
      return;
    }

    navigationSessionRef.current = {
      href: navigationIntent.href,
      preload: navigationIntent.preload,
      sawSlowNavigation: false,
      startedAt: navigationIntent.startedAt,
    };
    setIsIntentActive(true);

    const timeoutId = window.setTimeout(() => {
      setIsIntentActive(false);
    }, NAVIGATION_ACKNOWLEDGEMENT_MIN_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [navigationIntent]);

  const shouldAcknowledgeNavigation = isIntentActive || routerState.isSlowNavigation;

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (acknowledgementTimeoutRef.current !== null) {
      window.clearTimeout(acknowledgementTimeoutRef.current);
      acknowledgementTimeoutRef.current = null;
    }

    if (shouldAcknowledgeNavigation) {
      acknowledgementStartedAtRef.current ??= window.performance.now();
      setIsAcknowledgingNavigation(true);
      return;
    }

    if (!isAcknowledgingNavigation) {
      acknowledgementStartedAtRef.current = null;
      return;
    }

    const startedAt = acknowledgementStartedAtRef.current ?? window.performance.now();
    const remainingMs = Math.max(
      NAVIGATION_ACKNOWLEDGEMENT_MIN_MS - (window.performance.now() - startedAt),
      0
    );

    if (remainingMs === 0) {
      acknowledgementStartedAtRef.current = null;
      setIsAcknowledgingNavigation(false);
      return;
    }

    acknowledgementTimeoutRef.current = window.setTimeout(() => {
      acknowledgementStartedAtRef.current = null;
      acknowledgementTimeoutRef.current = null;
      setIsAcknowledgingNavigation(false);
    }, remainingMs);

    return () => {
      if (acknowledgementTimeoutRef.current !== null) {
        window.clearTimeout(acknowledgementTimeoutRef.current);
        acknowledgementTimeoutRef.current = null;
      }
    };
  }, [isAcknowledgingNavigation, shouldAcknowledgeNavigation]);

  React.useEffect(() => {
    if (routerState.isSlowNavigation) {
      if (!navigationSessionRef.current) {
        navigationSessionRef.current = {
          href: routerState.pendingPath,
          preload: null,
          sawSlowNavigation: true,
          startedAt: performance.now(),
        };
      } else {
        navigationSessionRef.current.sawSlowNavigation = true;
      }
    }
  }, [routerState.isSlowNavigation, routerState.pendingPath]);

  React.useEffect(() => {
    if (!import.meta.env.DEV || isAcknowledgingNavigation) {
      return;
    }

    const session = navigationSessionRef.current;
    if (!session) {
      return;
    }

    const debugState: NavigationDebugState = session.sawSlowNavigation
      ? "loader-running"
      : session.preload
        ? "preloaded"
        : "cache-hit";
    const durationMs = Math.round(performance.now() - session.startedAt);
    const target = session.href ?? routerState.pendingPath ?? "unknown";

    console.info(`[navigation-feedback] ${debugState} ${target} ${durationMs}ms`);
    navigationSessionRef.current = null;
  }, [isAcknowledgingNavigation, routerState.pendingPath]);

  const debugState: NavigationDebugState | null = !isAcknowledgingNavigation
    ? null
    : routerState.isSlowNavigation
      ? "loader-running"
      : navigationIntent?.preload
        ? "preloaded"
        : "cache-hit";
  const liveText = isAcknowledgingNavigation
    ? routerState.isSlowNavigation
      ? "Loading page"
      : "Opening page"
    : "";

  return {
    debugState,
    isAcknowledgingNavigation,
    isSlowNavigation: routerState.isSlowNavigation,
    liveText,
    pendingPath: routerState.pendingPath,
  };
}

export function ShellNavigationFeedbackIndicator({
  className,
  debugState,
  isAcknowledgingNavigation,
  isSlowNavigation,
  liveText,
}: {
  className?: string;
  debugState: NavigationDebugState | null;
  isAcknowledgingNavigation: boolean;
  isSlowNavigation: boolean;
  liveText: string;
}) {
  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-[70] h-1 transition-opacity duration-150",
          isAcknowledgingNavigation ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="relative h-full overflow-hidden bg-primary/12">
          <div className="navigation-progress-bar absolute inset-y-0 left-0 w-2/5 rounded-full bg-primary shadow-[0_0_24px_hsl(var(--primary)/0.35)]" />
        </div>
      </div>
      <div
        className={cn(
          "ml-auto flex items-center transition-opacity duration-150",
          isAcknowledgingNavigation ? "opacity-100" : "opacity-0",
          className
        )}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/95 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
          <span
            className={cn(
              "size-2 rounded-full transition-colors",
              isSlowNavigation ? "animate-pulse bg-primary" : "bg-primary/70"
            )}
          />
          <span className="sm:hidden">{isSlowNavigation ? "Loading" : "Opening"}</span>
          <span className="hidden sm:inline">
            {isSlowNavigation ? "Loading page" : "Opening page"}
          </span>
          {import.meta.env.DEV && debugState ? (
            <span className="rounded-full bg-muted px-2 py-0.5 font-semibold tracking-[0.18em] text-[10px] text-muted-foreground uppercase">
              {debugState}
            </span>
          ) : null}
        </div>
      </div>
      <p aria-live="polite" className="sr-only">
        {liveText}
      </p>
    </>
  );
}

export function useNavigationPendingState() {
  const feedback = useShellNavigationFeedback();

  return {
    isNavigating: feedback.isSlowNavigation,
    isVisible: feedback.isAcknowledgingNavigation,
    pendingPath: feedback.pendingPath,
  };
}

export function NavigationPendingIndicator({
  className,
}: {
  className?: string;
}) {
  const feedback = useShellNavigationFeedback();

  return (
    <ShellNavigationFeedbackIndicator
      className={className}
      debugState={feedback.debugState}
      isAcknowledgingNavigation={feedback.isAcknowledgingNavigation}
      isSlowNavigation={feedback.isSlowNavigation}
      liveText={feedback.liveText}
    />
  );
}
