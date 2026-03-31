import * as React from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export const PendingLink = React.forwardRef<HTMLAnchorElement, any>(
  function PendingLink({ className, preload = "intent", ...props }, ref) {
    return (
      <Link
        ref={ref as never}
        preload={preload}
        className={cn(
          "transition-[opacity,transform,background-color,border-color] duration-200 data-[transitioning=transitioning]:scale-[0.99] data-[transitioning=transitioning]:opacity-70",
          className
        )}
        {...(props as any)}
      />
    );
  }
);
