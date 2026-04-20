export const isBackendConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);

export const backendUnavailableMessage =
  "This deployment is missing its backend configuration, so account and order features are unavailable here.";
