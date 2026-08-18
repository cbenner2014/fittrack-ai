import { Component } from '@angular/core';
import { NavController, LoadingController, AlertController, ToastController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  isRegistering = false;
  fullName = '';
  email = '';
  password = '';

  constructor(
    private navCtrl: NavController,
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ionViewWillEnter() {
    // Si el usuario ya está autenticado, no permitir ver el login y enviarlo al Home
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (token) {
      if (role === 'ROLE_ADMIN') {
        this.navCtrl.navigateRoot('/admin', { animated: false, replaceUrl: true });
      } else {
        this.navCtrl.navigateRoot('/home', { animated: false, replaceUrl: true });
      }
    }
  }

  toggleRegister() {
    this.isRegistering = !this.isRegistering;
  }

  async login() {
    if (!this.email || !this.password) {
      const alert = await this.alertCtrl.create({
        header: 'Campos vacíos',
        message: 'Por favor ingresa tu correo y contraseña.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Iniciando sesión de forma segura...',
      spinner: 'crescent'
    });
    await loading.present();

    const loginData = { email: this.email.trim(), password: this.password };

    this.http.post('/api/v1/users/login', loginData).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        if (res.success) {
          // Guardar datos de sesión, ROL y el TOKEN
          localStorage.setItem('userId', res.userId);
          localStorage.setItem('userName', res.fullName);
          localStorage.setItem('userRole', res.role || 'ROLE_USER');
          if (res.token) localStorage.setItem('token', res.token);

          const toast = await this.toastCtrl.create({
            message: res.role === 'ROLE_ADMIN'
              ? `👑 Bienvenido al Panel Administrador, ${res.fullName || 'Admin'}`
              : `👋 ¡Hola de nuevo, ${res.fullName || 'Atleta'}! Preparando tu entrenamiento...`,
            duration: 2500,
            color: 'success',
            position: 'top'
          });
          toast.present();

          // Redirección inteligente reemplazando el historial para que atrás no vuelva al login
          if (res.role === 'ROLE_ADMIN') {
            this.navCtrl.navigateRoot('/admin', { animated: true, replaceUrl: true });
          } else {
            this.navCtrl.navigateRoot('/home', { animated: true, replaceUrl: true });
          }
        }
      },
      error: async (err) => {
        await loading.dismiss();
        const alert = await this.alertCtrl.create({
          header: 'Acceso Denegado',
          message: 'El correo o la contraseña son incorrectos.',
          buttons: ['Intentar de nuevo']
        });
        await alert.present();
      }
    });
  }

  async register() {
    if (!this.fullName || !this.email || !this.password) {
      const alert = await this.alertCtrl.create({
        header: 'Campos incompletos',
        message: 'Por favor llena todos los campos para registrarte.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Creando y asegurando tu cuenta...',
      spinner: 'crescent'
    });
    await loading.present();

    const registerData = { 
      fullName: this.fullName.trim(),
      email: this.email.trim(), 
      password: this.password 
    };

    this.http.post('/api/v1/users/register', registerData).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        if (res.success) {
          // Logueo automático tras registro
          localStorage.setItem('userId', res.data.id);
          localStorage.setItem('userName', res.data.fullName);
          localStorage.setItem('userRole', res.role || 'ROLE_USER');
          if (res.token) localStorage.setItem('token', res.token);
          
          const toast = await this.toastCtrl.create({
            message: `🎉 ¡Cuenta creada con éxito! Bienvenido a FitTrack, ${res.data.fullName}`,
            duration: 3000,
            color: 'success',
            position: 'top'
          });
          toast.present();

          // Redirigir al perfil para completar datos físicos iniciales reemplazando login del historial
          this.navCtrl.navigateRoot('/profile', { animated: true, replaceUrl: true });
        }
      },
      error: async (err) => {
        await loading.dismiss();
        const alert = await this.alertCtrl.create({
          header: 'Error al registrar',
          message: 'Hubo un problema. Intenta con otro correo.',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }
}
