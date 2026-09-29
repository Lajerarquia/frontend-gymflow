/**
 * Configuración de producción (ng build). No hay secretos: una SPA es un cliente público y el client id
 * no es secreto. Aun así, los valores reales no se escriben aquí: reemplaza los placeholders al desplegar.
 */
export const environment = {
  production: true,
  azure: {
    tenantId: '<TENANT_ID>',
    clientId: '<CLIENT_ID>',
  },
  /** Scope expuesto por el App Registration "GymFlow". */
  apiScope: 'api://<CLIENT_ID>/access_as_user',
  /** URL del AWS API Gateway (HTTP API, stage $default). */
  apiBaseUrl: 'https://<API_ID>.execute-api.<REGION>.amazonaws.com',
};
