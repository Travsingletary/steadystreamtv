import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.supabase.currentUser$.pipe(
      map(user => {
        if (user) {
          return true;
        } else {
          // Store the attempted URL for redirect after login
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: state.url }
          });
          return false;
        }
      })
    );
  }
}

@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  canActivate(): Observable<boolean> {
    return this.supabase.currentUser$.pipe(
      map(user => {
        if (!user) {
          return true;
        } else {
          // User is already logged in, redirect to dashboard
          this.router.navigate(['/subscription']);
          return false;
        }
      })
    );
  }
}