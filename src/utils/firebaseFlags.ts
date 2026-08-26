export const isFirebaseEnabled = import.meta.env.VITE_FIREBASE_ENABLED === 'true';

export const isFirebaseConfigured = Boolean(
  isFirebaseEnabled &&
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_APP_ID
);
