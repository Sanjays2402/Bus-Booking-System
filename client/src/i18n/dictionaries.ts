/**
 * Translation dictionaries for the BusGo client.
 *
 * Keep keys flat and namespaced with dots (e.g. `nav.login`). When adding a
 * new key, add it to BOTH locales \u2014 the type below is derived from the EN
 * dictionary so missing Spanish entries surface at compile time.
 */

export const en = {
  // Nav / header
  'nav.login': 'Login',
  'nav.profile': 'Profile',
  'nav.admin': 'Admin',
  'nav.signOut': 'Sign out',
  'nav.help': 'Help',
  'nav.pricing': 'Pricing',

  // Footer
  'footer.tagline': 'Travel smarter.',
  'footer.help': 'Help & FAQs',
  'footer.pricing': 'Pricing & promos',

  // Home / search
  'home.heading': 'Find your next bus',
  'home.subheading': 'Search hundreds of routes across North America.',
  'home.cta.search': 'Search buses',
  'home.field.origin': 'From',
  'home.field.destination': 'To',
  'home.field.date': 'Date',

  // Auth
  'auth.login.title': 'Welcome back',
  'auth.login.cta': 'Log in',
  'auth.register.title': 'Create your account',
  'auth.register.cta': 'Sign up',
  'auth.forgot.link': 'Forgot password?',
  'auth.forgot.title': 'Reset your password',
  'auth.forgot.cta': 'Send reset link',
  'auth.reset.title': 'Choose a new password',
  'auth.reset.cta': 'Update password',
  'auth.field.email': 'Email',
  'auth.field.password': 'Password',
  'auth.field.newPassword': 'New password',
  'auth.field.name': 'Full name',

  // Seat selection
  'seat.legend.available': 'Available',
  'seat.legend.selected': 'Selected',
  'seat.legend.booked': 'Booked',
  'seat.legend.locked': 'Held by someone else',
  'seat.continue': 'Continue',
  'seat.lockNotice': 'Seats held for 5 minutes while you book.',

  // Booking confirmation
  'confirm.title': 'Booking confirmed',
  'confirm.downloadPdf': 'Download PDF ticket',

  // Misc
  'common.loading': 'Loading…',
  'common.cancel': 'Cancel',
  'common.back': 'Back',
  'common.theme': 'Theme',
  'common.language': 'Language',
} as const;

export type Locale = 'en' | 'es';
export type TranslationKey = keyof typeof en;

export const es: Record<TranslationKey, string> = {
  'nav.login': 'Iniciar sesi\u00f3n',
  'nav.profile': 'Perfil',
  'nav.admin': 'Admin',
  'nav.signOut': 'Cerrar sesi\u00f3n',
  'nav.help': 'Ayuda',
  'nav.pricing': 'Precios',

  'footer.tagline': 'Viaja con inteligencia.',
  'footer.help': 'Ayuda y FAQs',
  'footer.pricing': 'Precios y promociones',

  'home.heading': 'Encuentra tu pr\u00f3ximo autob\u00fas',
  'home.subheading': 'Busca cientos de rutas en toda Norteam\u00e9rica.',
  'home.cta.search': 'Buscar autobuses',
  'home.field.origin': 'Desde',
  'home.field.destination': 'Hasta',
  'home.field.date': 'Fecha',

  'auth.login.title': 'Bienvenido de nuevo',
  'auth.login.cta': 'Entrar',
  'auth.register.title': 'Crea tu cuenta',
  'auth.register.cta': 'Registrarse',
  'auth.forgot.link': '\u00bfOlvidaste tu contrase\u00f1a?',
  'auth.forgot.title': 'Restablecer tu contrase\u00f1a',
  'auth.forgot.cta': 'Enviar enlace',
  'auth.reset.title': 'Elige una nueva contrase\u00f1a',
  'auth.reset.cta': 'Actualizar contrase\u00f1a',
  'auth.field.email': 'Correo',
  'auth.field.password': 'Contrase\u00f1a',
  'auth.field.newPassword': 'Nueva contrase\u00f1a',
  'auth.field.name': 'Nombre completo',

  'seat.legend.available': 'Disponible',
  'seat.legend.selected': 'Seleccionado',
  'seat.legend.booked': 'Reservado',
  'seat.legend.locked': 'Reservado por otra persona',
  'seat.continue': 'Continuar',
  'seat.lockNotice': 'Asientos reservados durante 5 minutos mientras reservas.',

  'confirm.title': 'Reserva confirmada',
  'confirm.downloadPdf': 'Descargar boleto en PDF',

  'common.loading': 'Cargando\u2026',
  'common.cancel': 'Cancelar',
  'common.back': 'Atr\u00e1s',
  'common.theme': 'Tema',
  'common.language': 'Idioma',
};

export const dictionaries: Record<Locale, Record<TranslationKey, string>> = {
  en,
  es,
};

export const LOCALES: Array<{ code: Locale; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Espa\u00f1ol' },
];
