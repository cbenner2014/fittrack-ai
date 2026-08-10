import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  email = '';
  password = '';

  constructor(private router: Router) {}

  login() {
    // Por ahora simulamos el login y navegamos al dashboard
    if (this.email && this.password) {
      console.log('Autenticando:', this.email);
      this.router.navigate(['/home']);
    } else {
      console.log('Llene los campos');
    }
  }
}
