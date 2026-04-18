import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/lib/cart";
import { AuthProvider } from "@/lib/auth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-8xl text-primary">404</h1>
        <h2 className="mt-4 font-display text-2xl">Off the pitch</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          That page doesn't exist. Let's get you back to the action.
        </p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90">
          Back home
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "JerseyHub — Premium Sports Jerseys" },
      { name: "description", content: "Shop authentic sports jerseys. Football, basketball, cricket and more. Cash on Delivery available." },
      { property: "og:title", content: "JerseyHub — Premium Sports Jerseys" },
      { property: "og:description", content: "Shop authentic sports jerseys. Football, basketball, cricket and more. Cash on Delivery available." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "JerseyHub — Premium Sports Jerseys" },
      { name: "twitter:description", content: "Shop authentic sports jerseys. Football, basketball, cricket and more. Cash on Delivery available." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/AqiOKzJb93eKKeZLDkHeDIQa7Ok1/social-images/social-1776512821247-photo_2026-04-18_17-16-40.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/AqiOKzJb93eKKeZLDkHeDIQa7Ok1/social-images/social-1776512821247-photo_2026-04-18_17-16-40.webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
        <Toaster richColors position="top-center" />
      </CartProvider>
    </AuthProvider>
  );
}
