import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { LoadingController, AlertController } from '@ionic/angular';

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
    private alertCtrl: AlertController
  ) {}

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
      message: 'Autenticando...',
      spinner: 'crescent'
    });
    await loading.present();

    const loginData = { email: this.email, password: this.password };

    this.http.post('/api/v1/users/login', loginData).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        if (res.success) {
          // Guardar datos de sesión, ROL y el TOKEN
          localStorage.setItem('userId', res.userId);
          localStorage.setItem('userName', res.fullName);
          localStorage.setItem('userRole', res.role || 'ROLE_USER');
          if (res.token) localStorage.setItem('token', res.token);

          // Redirección inteligente según el ROL
          if (res.role === 'ROLE_ADMIN') {
            this.navCtrl.navigateRoot('/admin');
          } else {
            this.navCtrl.navigateRoot('/home');
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
      message: 'Creando cuenta...',
      spinner: 'crescent'
    });
    await loading.present();

    const registerData = { 
      fullName: this.fullName,
      email: this.email, 
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
          
          // Redirigir al perfil para completar datos físicos iniciales
          this.navCtrl.navigateRoot('/profile');
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
