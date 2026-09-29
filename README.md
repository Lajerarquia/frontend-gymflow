# frontend-gymflow

Frontend de GymFlow en **Angular 20** (standalone) con **MSAL** (`@azure/msal-angular` 4 + `@azure/msal-browser` 4).
Inicia sesión con Azure AD, obtiene el access token del API y lo envía como `Bearer` al AWS API Gateway,
que lo reenvía al BFF (`ms-gymflow-bff`).

```
Angular + MSAL ──Bearer JWT──> AWS API Gateway (JWT Authorizer) ──> ms-gymflow-bff ──> reservations / catalog
```

## Autenticación (MSAL)

| Pieza | Dónde | Qué hace |
|---|---|---|
| `PublicClientApplication` | `auth/msal.config.ts` | Authorization code + PKCE; authority con el tenant; caché en `sessionStorage` |
| `redirectUri` = raíz (`http://localhost:4200`) | `auth/msal.config.ts`, `app.routes.ts` | Es la URI registrada en Azure. La ruta `''` muestra el login sin guard ni redirect, así el router no borra el `#code` |
| `handleRedirectObservable()` | `app.ts` | Procesa la respuesta de Azure en cada carga |
| `MsalGuard` + `rolGuard` | `app.routes.ts`, `auth/rol.guard.ts` | Sesión obligatoria + rol según `data.roles`; sin rol → `/forbidden` |
| `MsalInterceptor` | `app.config.ts` | Adjunta `Authorization: Bearer <access_token>` a `<apiBaseUrl>/api/*` (interceptor de clase: `withInterceptorsFromDi()` + `HTTP_INTERCEPTORS`) |
| Roles y scopes | `auth/sesion.service.ts`, `auth/jwt.ts` | Se leen de los claims `roles` y `scp` del **access token**, decodificado como UTF-8 |
| Renovación | `MsalInterceptor` / `sesion.service.ts` | `acquireTokenSilent`; si Azure exige interacción (`InteractionRequiredAuthError`) → `acquireTokenRedirect`. Otros errores se muestran como aviso, nunca pantalla en blanco |
| Login / logout | `sesion.service.ts` | `loginRedirect` / `logoutRedirect` |

El guard y el menú solo mejoran la experiencia: quien autoriza de verdad es el BFF (401/403 en JSON),
y sus mensajes se muestran tal cual en pantalla.

## Pantallas

| Ruta | Roles | Contenido |
|---|---|---|
| `/login` | público | Botón «Iniciar sesión con Microsoft» |
| `/dashboard` | autenticados | Admin: cifras de la cadena · Instructor: por confirmar y en clase · Socio: próximas clases · Auditor: últimos eventos · Todos: "Mi sesión" (claims + prueba de `GET /api/me`) |
| `/reservations` | Admin, Instructor, Socio | Listar con filtros, crear, cambiar estado según el rol |
| `/catalog` | Admin, Instructor | Clases y salas; el Admin crea, edita (plan y cupo) y elimina |
| `/reports` | Admin | Reservas por hora, ocupación, clases más demandadas (calculado con datos reales) |
| `/audit` | Admin, Auditor | Timeline con `createdBy/updatedBy/createdAt/updatedAt`, filtros por usuario, fechas y tipo |

`/reports` y `/audit` se calculan en el frontend con `/api/reservations` y `/api/catalog/services`.
En la EP2 vendrán de `ms-gymflow-report` y `ms-gymflow-audit` vía Kafka.

## Configuración de Azure AD

App Registration **"GymFlow"** (uno solo para la SPA y el API; tenant y client id no son secretos y ya están
en `src/environments/`):

| Dato | Valor |
|---|---|
| Tenant | `6a3e6e0e-c7e4-4a0a-9a66-1778df0b3b19` |
| Client id | `ee1bba85-7f98-4977-bf8b-f6acebb7ec6f` |
| Scope | `api://ee1bba85-7f98-4977-bf8b-f6acebb7ec6f/access_as_user` |
| Redirect URI (SPA) | `http://localhost:4200` |
| Tokens | v2 (`requestedAccessTokenVersion: 2`) · App roles `Admin`, `Instructor`, `Socio`, `Auditor` |

Al desplegar el frontend en otro dominio hay que registrar su origen (ej. `https://<dominio>`) como redirect
URI de tipo SPA y reemplazar `<API_ID>` y `<REGION>` en `src/environments/environment.ts`.

## Ejecutar

Requiere **Node 22 LTS** (Angular 20 no soporta Node 23).

```bash
npm ci
npx ng serve           # http://localhost:4200, apunta al BFF en http://localhost:8080
npx ng build           # producción, en dist/frontend-gymflow
npx ng test --watch=false --browsers=ChromeHeadless
```

Las pruebas cubren la decodificación UTF-8 del token, el guard de roles, las acciones permitidas por rol,
los cálculos de reportería y auditoría y los mensajes de error.
