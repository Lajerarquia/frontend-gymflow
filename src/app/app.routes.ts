import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { rolGuard } from './auth/rol.guard';
import { Rol } from './auth/roles';
import { Login } from './pages/login/login';

/** Roles de cada pantalla (CLAUDE.md). El BFF aplica la misma matriz y responde 403 si no calzan. */
const roles = (...permitidos: Rol[]) => ({ roles: permitidos });

export const routes: Routes = [
  // Raíz = redirectUri registrada en Azure AD. Muestra el login SIN guard ni redirectTo: si redirigiera,
  // el router podría borrar el #code antes de que MSAL lo lea. El login navega al dashboard cuando MSAL termina.
  { path: '', pathMatch: 'full', component: Login, title: 'GymFlow' },
  { path: 'login', component: Login, title: 'Iniciar sesión · GymFlow' },
  {
    path: 'dashboard',
    canActivate: [MsalGuard, rolGuard],
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
    title: 'Inicio · GymFlow',
  },
  {
    path: 'reservations',
    canActivate: [MsalGuard, rolGuard],
    data: roles('Admin', 'Instructor', 'Socio'),
    loadComponent: () => import('./pages/reservations/reservations').then((m) => m.Reservations),
    title: 'Reservas · GymFlow',
  },
  {
    path: 'catalog',
    canActivate: [MsalGuard, rolGuard],
    data: roles('Admin', 'Instructor'),
    loadComponent: () => import('./pages/catalog/catalog').then((m) => m.Catalog),
    title: 'Catálogo · GymFlow',
  },
  {
    path: 'reports',
    canActivate: [MsalGuard, rolGuard],
    data: roles('Admin'),
    loadComponent: () => import('./pages/reports/reports').then((m) => m.Reports),
    title: 'Reportería · GymFlow',
  },
  {
    path: 'audit',
    canActivate: [MsalGuard, rolGuard],
    data: roles('Admin', 'Auditor'),
    loadComponent: () => import('./pages/audit/audit').then((m) => m.Audit),
    title: 'Auditoría · GymFlow',
  },
  {
    path: 'admin/mq',
    canActivate: [MsalGuard, rolGuard],
    data: roles('Admin'),
    loadComponent: () => import('./pages/admin-mq/admin-mq').then((m) => m.AdminMq),
    title: 'RabbitMQ · GymFlow',
  },
  {
    path: 'forbidden',
    canActivate: [MsalGuard],
    loadComponent: () => import('./pages/forbidden/forbidden').then((m) => m.Forbidden),
    title: 'Sin permiso · GymFlow',
  },
  { path: '**', redirectTo: 'dashboard' },
];
