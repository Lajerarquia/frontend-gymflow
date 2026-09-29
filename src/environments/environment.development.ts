/**
 * Configuración de desarrollo (ng serve). Apunta al BFF local, que acepta CORS desde http://localhost:4200.
 * Reemplaza los placeholders con los datos del App Registration "GymFlow".
 */
export const environment = {
  production: false,
  azure: {
    tenantId: '<TENANT_ID>',
    clientId: '<CLIENT_ID>',
  },
  apiScope: 'api://<CLIENT_ID>/access_as_user',
  apiBaseUrl: 'http://localhost:8080',
};
