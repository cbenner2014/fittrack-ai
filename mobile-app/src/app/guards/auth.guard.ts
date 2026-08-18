import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean | UrlTree {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
      localStorage.clear();
      this.router.navigate(['/login']);
      return false;
    }

    try {
      // Validar si el token tiene formato JWT básico y no ha expirado
      const base64Url = token.split('.')[1];
      if (!base64Url) {
        localStorage.clear();
        this.router.navigate(['/login']);
        return false;
      }

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const tokenData = JSON.parse(jsonPayload);

      // Verificar expiración (exp está en segundos)
      if (tokenData.exp && Date.now() >= tokenData.exp * 1000) {
        localStorage.clear();
        this.router.navigate(['/login']);
        return false;
      }

      return true;

    } catch (e) {
      localStorage.clear();
      this.router.navigate(['/login']);
      return false;
    }
  }
}
