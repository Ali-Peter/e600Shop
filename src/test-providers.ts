import { registerLocaleData } from '@angular/common';
import localeEnNg from '@angular/common/locales/en-NG';
import { DEFAULT_CURRENCY_CODE, LOCALE_ID, Provider } from '@angular/core';

/**
 * Global providers for the unit-test environment (wired up through the
 * `providersFile` option of the `@angular/build:unit-test` builder).
 *
 * They mirror `app.config.ts` so that specs exercise the same locale and
 * currency defaults as the running application: the bare `| currency` pipe
 * renders Nigerian Naira (`\u20A6`) instead of falling back to `$`.
 */
registerLocaleData(localeEnNg);

const providers: Provider[] = [
  { provide: LOCALE_ID, useValue: 'en-NG' },
  { provide: DEFAULT_CURRENCY_CODE, useValue: 'NGN' },
];

export default providers;