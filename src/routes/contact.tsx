import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Rainbow Sports" },
      { name: "description", content: "Get in touch with Rainbow Sports. Call or email us for orders, support, returns and replacements." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 font-display text-5xl">CONTACT US</h1>
      <p className="mb-10 text-sm text-muted-foreground">
        We're here to help with your orders, returns and any questions.
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card/40 p-6">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <Phone className="h-5 w-5" />
            <h2 className="font-display text-xl">Phone</h2>
          </div>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="tel:+919943295343" className="hover:underline">+91 99432 95343</a>
            </li>
            <li>
              <a href="tel:+919042295343" className="hover:underline">+91 90422 95343</a>
            </li>
          </ul>
        </div>

        <div className="rounded-lg border border-border bg-card/40 p-6">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <Mail className="h-5 w-5" />
            <h2 className="font-display text-xl">Email</h2>
          </div>
          <a
            href="mailto:rainbowsports02@gmail.com"
            className="text-sm hover:underline"
          >
            rainbowsports02@gmail.com
          </a>
        </div>
      </div>

      <p className="mt-10 text-xs text-muted-foreground">
        For return or replacement requests, please email us with your order ID and photos/videos (if applicable).
      </p>
    </div>
  );
}