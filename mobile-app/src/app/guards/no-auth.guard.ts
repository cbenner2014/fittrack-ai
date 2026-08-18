import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean | UrlTree {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('userRole');

    // Si ya existe una sesión activa válida, no permitir entrar al Login
    if (token && userId) {
      try {
        const base64Url = token.split('.')[1];
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const tokenData = JSON.parse(jsonPayload);

          // Si el token aún no ha expirado, redirigir a su vista correspondiente
          if (!tokenData.exp || Date.now() < tokenData.exp * 1000) {
            if (role === 'ROLE_ADMIN' || tokenData.role === 'ROLE_ADMIN') {
              this.router.navigate(['/admin'], { replaceUrl: true });
            } else {
              this.router.navigate(['/home'], { replaceUrl: true });
            }
            return false;
          }
        }
      } catch (e) {
        // Si el token estaba corrupto, permitir acceder al login
        localStorage.clear();
        return true;
      }
    }

    return true;
  }
}
