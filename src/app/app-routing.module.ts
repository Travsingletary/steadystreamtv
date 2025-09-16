import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { isTauri } from '@tauri-apps/api/core';
import { xtreamRoutes } from './xtream-tauri/xtream.routes';
import { AppConfig } from '../environments/environment';
import { AuthGuard, NoAuthGuard } from './guards/auth.guard';

const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./home/home.component').then((c) => c.HomeComponent),
    },
    {
        path: 'playlists',
        loadComponent: () =>
            import(
                './player/components/video-player/video-player.component'
            ).then((c) => c.VideoPlayerComponent),
    },
    {
        path: 'iptv',
        loadComponent: () =>
            import(
                './player/components/video-player/video-player.component'
            ).then((c) => c.VideoPlayerComponent),
    },
    {
        path: 'playlists/:id',
        loadComponent: () =>
            import(
                './player/components/video-player/video-player.component'
            ).then((c) => c.VideoPlayerComponent),
    },
    {
        path: 'settings',
        loadComponent: () =>
            import('./settings/settings.component').then(
                (c) => c.SettingsComponent
            ),
    },
    {
        path: 'login',
        loadComponent: () =>
            import('./components/auth/login.component').then(
                (c) => c.LoginComponent
            ),
        canActivate: [NoAuthGuard]
    },
    {
        path: 'signup',
        loadComponent: () =>
            import('./components/auth/signup.component').then(
                (c) => c.SignupComponent
            ),
        canActivate: [NoAuthGuard]
    },
    {
        path: 'payment',
        loadComponent: () =>
            import('./components/payment/payment.component').then(
                (c) => c.PaymentComponent
            ),
        canActivate: [AuthGuard]
    },
    {
        path: 'subscription',
        loadComponent: () =>
            import('./components/subscription-dashboard/subscription-dashboard.component').then(
                (c) => c.SubscriptionDashboardComponent
            ),
        canActivate: [AuthGuard]
    },
    {
        path: 'app-config/:id',
        loadComponent: () =>
            import('./components/app-config/app-config.component').then(
                (c) => c.AppConfigComponent
            )
    },
    ...(isTauri()
        ? xtreamRoutes
        : [
              {
                  path: 'xtreams/:id',
                  loadComponent: () =>
                      import('./xtream/xtream-main-container.component').then(
                          (c) => c.XtreamMainContainerComponent
                      ),
              },
          ]),
    {
        path: 'portals/:id',
        loadComponent: () =>
            import('./stalker/stalker-main-container.component').then(
                (c) => c.StalkerMainContainerComponent
            ),
    },
    {
        path: '**',
        redirectTo: '',
    },
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, {
            enableTracing: !AppConfig.production,
        }),
    ],
    exports: [RouterModule],
})
export class AppRoutingModule {}
