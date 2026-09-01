import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole')?.toLowerCase() || null;
    
    if (!token || !role) {
      return this.router.parseUrl('/login');
    }

    const allowedRoles = route.data['roles'] as string[] | undefined;
    if (!allowedRoles || allowedRoles.length === 0) {
      return this.redirectToRoleHome(role);
    }

    if (allowedRoles.includes(role)) {
      return true;
    }

    return this.router.parseUrl('/access-denied');
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
