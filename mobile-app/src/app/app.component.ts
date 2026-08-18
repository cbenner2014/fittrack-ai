import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  showTabs = false;
  isAdmin = false;

  constructor(public router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects || event.url;
        const isAuthOrAdmin = url.includes('/login') || url.includes('/admin') || url === '/';
        this.showTabs = !isAuthOrAdmin;
        this.isAdmin = localStorage.getItem('userRole') === 'ROLE_ADMIN';
      }
    });
  }
}
