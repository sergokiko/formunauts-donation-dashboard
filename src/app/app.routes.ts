import { Routes } from '@angular/router';

const dashboard = () =>
  import('./view/pages/campaign-dashboard-page/campaign-dashboard-page').then((m) => m.CampaignDashboardPage);

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: dashboard },
  { path: 'campaigns/:campaignId', loadComponent: dashboard },
  {
    path: '**',
    loadComponent: () => import('./view/pages/not-found-page/not-found-page').then((m) => m.NotFoundPage)
  }
];
