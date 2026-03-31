import * as React from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export const PendingLink = React.forwardRef<HTMLAnchorElement, any>(
  function PendingLink({ className, preload = "intent", ...props }, ref) {
    return (
      <Link
        ref={ref as never}
        data-navigation-preload={preload === false ? undefined : String(preload)}
        preload={preload}
        className={cn(
          "transition-[opacity,transform,background-color,border-color,box-shadow] duration-200 data-[transitioning=transitioning]:scale-[0.99] data-[transitioning=transitioning]:opacity-70 data-[transitioning=transitioning]:shadow-sm data-[transitioning=transitioning]:ring-1 data-[transitioning=transitioning]:ring-primary/20",
          className
        )}
        {...(props as any)}
      />
    );
  }
);
