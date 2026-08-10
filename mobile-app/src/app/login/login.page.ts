import { Component } from '@angular/core';
import { Router } from '@angular/router';
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
    private router: Router,
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

    this.http.post('http://localhost:8080/api/v1/users/login', loginData).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        if (res.success) {
          // Guardar los datos de sesión en la memoria del celular
          localStorage.setItem('userId', res.userId);
          localStorage.setItem('userName', res.fullName);
          this.router.navigate(['/home']);
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

    this.http.post('http://localhost:8080/api/v1/users', registerData).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        if (res.success) {
          // Logueo automático tras registro
          localStorage.setItem('userId', res.data.id);
          localStorage.setItem('userName', res.data.fullName);
          
          // Como es nuevo, lo mandamos al Perfil de Usuario directo
          this.router.navigate(['/profile']);
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
