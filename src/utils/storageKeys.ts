/** Existing player keys. Do not rename — that would reset solvers. */
export const STORAGE_KEYS = {
  progress: 'cryptogram_progress_',
  dailyHints: 'cryptogram_daily_hints_',
  dailyChecks: 'cryptogram_daily_checks_',
  solvedIds: 'cryptogram_solved_ids',
  stats: 'cryptogram_stats',
  codename: 'cryptogram_codename',
  deskTheme: 'cryptogram_desk_theme',
  bureauDeskSeen: 'cryptogram_bureau_desk_seen',
  cipherKeyboard: 'cryptogram_cipher_keyboard',
  deliverySubscribed: 'cryptogram_delivery_subscribed',
  deliveryLast: 'cryptogram_delivery_last',
  offlinePack: 'cryptogram_offline_pack',
  splashEntered: 'chronicle_splash_entered',
} as const;
