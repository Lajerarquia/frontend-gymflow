/**
 * Configuración de desarrollo (ng serve). Apunta al BFF local, que acepta CORS desde http://localhost:4200.
 * Tenant y client id del App Registration "GymFlow" (no son secretos).
 */
export const environment = {
  production: false,
  azure: {
    tenantId: '6a3e6e0e-c7e4-4a0a-9a66-1778df0b3b19',
    clientId: 'ee1bba85-7f98-4977-bf8b-f6acebb7ec6f',
  },
  apiScope: 'api://ee1bba85-7f98-4977-bf8b-f6acebb7ec6f/access_as_user',
  apiBaseUrl: 'https://0z97ecbdsc.execute-api.us-east-1.amazonaws.com',
};
