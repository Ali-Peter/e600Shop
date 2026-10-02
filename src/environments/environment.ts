/**
 * Development build settings — used by `ng serve` and `ng test`
 * (angular.json only applies `fileReplacements` for the `production` build).
 *
 * `apiBaseUrl` matches the backend's Properties/launchSettings.json port.
 * Public configuration only — never put secrets in the frontend.
 */
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5264',
};
