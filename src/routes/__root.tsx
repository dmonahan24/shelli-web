import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import * as React from "react";
import { DefaultCatchBoundary } from "@/components/default-catch-boundary";
import { NotFound } from "@/components/not-found";
import "@/styles/app.css";
import { seo } from "@/utils/seo";
import { Providers } from "@/components/providers";

const criticalShellStyles = `
  :root {
    color-scheme: light;
    --shell-background: #fbfaf8;
    --shell-foreground: #3f3a34;
    --shell-card: rgba(255, 255, 255, 0.96);
    --shell-border: rgba(103, 93, 83, 0.14);
    --shell-primary: #6f5a46;
    --shell-primary-foreground: #ffffff;
    --shell-muted: #6f6a64;
    --shell-shadow: 0 18px 48px rgba(31, 24, 17, 0.10);
    --shell-dark: #1d1814;
  }

  * { box-sizing: border-box; }

  html, body {
    margin: 0;
    min-height: 100%;
    background: var(--shell-background);
    color: var(--shell-foreground);
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  body {
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  h1, h2, h3, p {
    margin: 0;
  }

  a {
    color: inherit;
  }

  [data-shell-surface="marketing"],
  [data-shell-surface="auth"] {
    min-height: 100vh;
    background:
      radial-gradient(circle at top, rgba(230, 190, 138, 0.18), transparent 40%),
      linear-gradient(180deg, rgba(246, 242, 235, 1) 0%, rgba(255, 255, 255, 1) 100%);
  }

  [data-slot="card"] {
    border: 1px solid var(--shell-border);
    background: var(--shell-card);
    color: var(--shell-foreground);
    border-radius: 1.75rem;
    box-shadow: var(--shell-shadow);
  }

  [data-slot="card-content"] {
    padding: 1.25rem;
  }

  [data-slot="button"] {
    appearance: none;
    border: 0;
    border-radius: 0.875rem;
    min-height: 2.75rem;
    padding: 0.75rem 1rem;
    background: var(--shell-primary);
    color: var(--shell-primary-foreground);
    font: inherit;
    font-weight: 600;
    text-decoration: none;
  }

  [data-slot="input"] {
    width: 100%;
    min-height: 2.75rem;
    border: 1px solid rgba(103, 93, 83, 0.2);
    border-radius: 0.875rem;
    background: rgba(255, 255, 255, 0.9);
    color: var(--shell-foreground);
    padding: 0.75rem 0.875rem;
    font: inherit;
  }

  [data-slot="auth-shell-card"] {
    border-radius: 1.875rem;
    border: 1px solid rgba(103, 93, 83, 0.14);
    background: rgba(255, 255, 255, 0.96);
    box-shadow: var(--shell-shadow);
  }

  @media (min-width: 1024px) {
    [data-slot="auth-shell-panel"] {
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: var(--shell-dark);
      color: #f6f1eb;
      border-radius: 2rem;
      box-shadow: 0 24px 60px rgba(18, 14, 11, 0.28);
    }
  }
`;

export const Route = createRootRouteWithContext<Record<string, never>>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      ...seo({
        title: "Shelli Concrete Tracker",
        description:
          "Construction project tracking for concrete pours, schedules, and field-ready records.",
      }),
    ],
    links: [
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/favicon-16x16.png",
      },
      { rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
      { rel: "icon", href: "/favicon.ico" },
    ],
  }),
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    );
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: criticalShellStyles }} />
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Scripts />
      </body>
    </html>
  );
}
