/**
 * Configuración de producción (ng build). No hay secretos: una SPA es un cliente público y el tenant y el
 * client id no son secretos. Falta la URL del API Gateway: reemplaza <API_ID> y <REGION> al desplegar.
 */
export const environment = {
  production: true,
  azure: {
    tenantId: '6a3e6e0e-c7e4-4a0a-9a66-1778df0b3b19',
    clientId: 'ee1bba85-7f98-4977-bf8b-f6acebb7ec6f',
  },
  /** Scope expuesto por el App Registration "GymFlow". */
  apiScope: 'api://ee1bba85-7f98-4977-bf8b-f6acebb7ec6f/access_as_user',
  /** URL del AWS API Gateway (HTTP API, stage $default). */
  apiBaseUrl: 'https://0z97ecbdsc.execute-api.us-east-1.amazonaws.com',
};
