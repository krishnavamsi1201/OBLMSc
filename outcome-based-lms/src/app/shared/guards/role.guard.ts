import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const role = (localStorage.getItem('userRole') || '').toLowerCase().trim();
    
    if (!role) {
      return this.router.parseUrl('/login');
    }

    const allowedRoles = route.data['roles'] as string[] | undefined;
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase().trim());
    if (normalizedAllowed.includes(role)) {
      return true;
    }

    return this.redirectToRoleHome(role);
  }

  private redirectToRoleHome(role: string): UrlTree {
    if (role === 'admin') {
      return this.router.parseUrl('/admin');
    }
    if (role === 'faculty') {
      return this.router.parseUrl('/faculty');
    }
    if (role === 'student') {
      return this.router.parseUrl('/students');
    }
    return this.router.parseUrl('/login');
  }
}
