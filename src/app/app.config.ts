import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import localeEnNg from '@angular/common/locales/en-NG';
import {
  ApplicationConfig,
  DEFAULT_CURRENCY_CODE,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';

// The storefront trades in Nigerian Naira: the en-NG locale data provides the '₦'
// symbol, so the bare `| currency` pipe renders prices consistently across the app.
registerLocaleData(localeEnNg);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    { provide: LOCALE_ID, useValue: 'en-NG' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'NGN' },
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
  ],
};
