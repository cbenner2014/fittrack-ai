import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { 
  Platform, 
  ActionSheetController, 
  ModalController, 
  AlertController, 
  PopoverController, 
  NavController 
} from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  showTabs = false;
  isAdmin = false;

  constructor(
    public router: Router,
    private platform: Platform,
    private actionSheetCtrl: ActionSheetController,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private popoverCtrl: PopoverController,
    private navCtrl: NavController
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects || event.url;
        const isAuthOrAdmin = url.includes('/login') || url.includes('/admin') || url === '/';
        this.showTabs = !isAuthOrAdmin;
        this.isAdmin = localStorage.getItem('userRole') === 'ROLE_ADMIN';
      }
    });
  }

  goToTab(route: string) {
    if (this.router.url === route || this.router.url.startsWith(route)) return;
    this.navCtrl.navigateRoot(route, { animated: false, replaceUrl: true });
  }

  ngOnInit() {
    this.initBackButtonHandling();
  }

  private initBackButtonHandling() {
    // 1. Manejador de prioridad máxima para gestos de retroceso en celular y botón Atrás
    this.platform.backButton.subscribeWithPriority(9999, async () => {
      // Prioridad A: Cerrar menú ActionSheet si está abierto (ej: Escanear Comida)
      const actionSheet = await this.actionSheetCtrl.getTop();
      if (actionSheet) {
        await actionSheet.dismiss();
        return;
      }

      // Prioridad B: Cerrar Modal si está abierto (ej: Detalle de Comida o Máquina)
      const modal = await this.modalCtrl.getTop();
      if (modal) {
        await modal.dismiss();
        return;
      }

      // Prioridad C: Cerrar Alertas o Popovers
      const alert = await this.alertCtrl.getTop();
      if (alert) {
        await alert.dismiss();
        return;
      }
      const popover = await this.popoverCtrl.getTop();
      if (popover) {
        await popover.dismiss();
        return;
      }

      // Prioridad D: Si estamos en la raíz (/home, /admin, /login), no saltar al login
      const currentUrl = this.router.url;
      if (currentUrl === '/home' || currentUrl.startsWith('/home') || 
          currentUrl === '/admin' || currentUrl.startsWith('/admin') || 
          currentUrl === '/login' || currentUrl === '/') {
        return; // Mantenerse en la app y no cerrar sesión
      }

      // Prioridad E: Si estamos en sub-vistas (/history, /profile, /gimnasios), volver atrás
      this.navCtrl.back();
    });

    // 2. Manejador de navegación del historial del navegador (popstate en Chrome / Safari móvil)
    window.addEventListener('popstate', async () => {
      const actionSheet = await this.actionSheetCtrl.getTop();
      if (actionSheet) {
        await actionSheet.dismiss();
      }
      const modal = await this.modalCtrl.getTop();
      if (modal) {
        await modal.dismiss();
      }
      const alert = await this.alertCtrl.getTop();
      if (alert) {
        await alert.dismiss();
      }
    });
  }
}
