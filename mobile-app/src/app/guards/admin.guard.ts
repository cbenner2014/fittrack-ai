import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  canActivate(): boolean | UrlTree {
    const token = localStorage.getItem('token');
    const localRole = localStorage.getItem('userRole');

    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    try {
      // Decodificar el Payload del Token JWT real emitido por el backend
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const tokenData = JSON.parse(jsonPayload);

      // Si el rol en el token JWT no es ROLE_ADMIN (intento de manipulación de localStorage)
      if (tokenData.role !== 'ROLE_ADMIN') {
        // Restaurar el rol real en localStorage
        localStorage.setItem('userRole', tokenData.role || 'ROLE_USER');
        this.showForbiddenToast();
        this.router.navigate(['/home']);
        return false;
      }

      // Si el rol en el localStorage no coincide con el token
      if (localRole !== 'ROLE_ADMIN') {
        this.showForbiddenToast();
        this.router.navigate(['/home']);
        return false;
      }

      return true;

    } catch (e) {
      console.error('Token inválido en AdminGuard:', e);
      localStorage.clear();
      this.router.navigate(['/login']);
      return false;
    }
  }

  private async showForbiddenToast() {
    const toast = await this.toastCtrl.create({
      message: '⛔ ACCESO DENEGADO: Se requieren privilegios reales de Administrador.',
      duration: 3500,
      color: 'danger',
      position: 'top'
    });
    toast.present();
  }
}
