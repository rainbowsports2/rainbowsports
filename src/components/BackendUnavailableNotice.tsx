import { Link } from "@tanstack/react-router";
import { backendUnavailableMessage } from "@/lib/backend";

type BackendUnavailableNoticeProps = {
  title?: string;
  showHomeLink?: boolean;
};

export function BackendUnavailableNotice({
  title = "Backend unavailable",
  showHomeLink = true,
}: BackendUnavailableNoticeProps) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/40 p-8 text-center">
      <h2 className="font-display text-3xl">{title}</h2>
      <p className="mt-3 text-sm text-muted-foreground">{backendUnavailableMessage}</p>
      {showHomeLink && (
        <Link to="/" className="mt-4 inline-block text-sm font-bold uppercase tracking-wider text-primary">
          Go home
        </Link>
      )}
    </div>
  );
}
