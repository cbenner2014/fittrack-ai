import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AlertController, LoadingController, ToastController, NavController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: false
})
export class AdminPage implements OnInit {
  currentTab: string = 'dashboard'; // 'dashboard' | 'users' | 'machines' | 'ai'
  
  adminName: string = 'Administrador';
  adminEmail: string = '';
  
  // Métricas
  stats: any = {
    totalUsers: 0,
    totalMealsLogged: 0,
    totalMachinesLogged: 0,
    adminUsersCount: 0,
    goalsDistribution: {
      loseWeight: 0,
      gainMuscle: 0,
      maintain: 0
    }
  };

  // Usuarios
  usersList: any[] = [];
  filteredUsers: any[] = [];
  searchQuery: string = '';
  roleFilter: string = 'ALL';

  // Máquinas
  machinesList: any[] = [];
  newMachine = {
    name: '',
    targetMuscles: '',
    usageInstructions: '',
    tips: '',
    imageUrl: ''
  };

  isLoading: boolean = false;

  constructor(
    private http: HttpClient,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private navCtrl: NavController,
    public router: Router
  ) {}

  ngOnInit() {
    this.checkAdminAuth();
  }

  ionViewWillEnter() {
    this.checkAdminAuth();
  }

  checkAdminAuth() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    this.adminName = localStorage.getItem('userName') || 'Administrador';

    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    if (role !== 'ROLE_ADMIN') {
      // Si no es admin, redirigir a la app normal
      this.navCtrl.navigateRoot('/home');
      return;
    }

    this.loadStats();
    this.loadUsers();
    this.loadMachines();
  }

  setTab(tab: string) {
    this.currentTab = tab;
    if (tab === 'users') {
      this.loadUsers();
    } else if (tab === 'machines') {
      this.loadMachines();
    } else if (tab === 'dashboard') {
      this.loadStats();
    }
  }

  // --- CARGA DE DATOS ---
  loadStats() {
    this.http.get('/api/v1/admin/stats').subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.stats = res.data;
        }
      },
      error: (err) => console.error('Error cargando stats:', err)
    });
  }

  loadUsers() {
    this.isLoading = true;
    this.http.get('/api/v1/admin/users').subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.usersList = res.data;
          this.applyUserFilter();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error cargando usuarios:', err);
      }
    });
  }

  loadMachines() {
    this.http.get('/api/v1/machines').subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.machinesList = res;
        } else if (res.data) {
          this.machinesList = res.data;
        }
      },
      error: (err) => console.error('Error cargando máquinas:', err)
    });
  }

  // --- FILTROS DE USUARIOS ---
  applyUserFilter() {
    let filtered = [...this.usersList];

    if (this.roleFilter !== 'ALL') {
      filtered = filtered.filter(u => u.role === this.roleFilter);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        (u.fullName && u.fullName.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.id && u.id.toString().includes(q))
      );
    }

    this.filteredUsers = filtered;
  }

  // --- GESTIÓN DE ROLES ---
  async toggleRole(user: any) {
    const newRole = user.role === 'ROLE_ADMIN' ? 'ROLE_USER' : 'ROLE_ADMIN';
    const roleLabel = newRole === 'ROLE_ADMIN' ? 'Administrador' : 'Usuario Normal';

    const alert = await this.alertCtrl.create({
      header: 'Cambiar Rol',
      message: `¿Deseas cambiar el rol de ${user.fullName || user.email} a <b>${roleLabel}</b>?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: () => {
            this.http.put(`/api/v1/admin/users/${user.id}/role`, { role: newRole }).subscribe({
              next: async (res: any) => {
                user.role = newRole;
                this.presentToast(`Rol actualizado a ${roleLabel}`, 'success');
                this.loadStats();
              },
              error: (err) => this.presentToast('Error al cambiar rol', 'danger')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  // --- RESTABLECER CONTRASEÑA ---
  async openResetPasswordModal(user: any) {
    const alert = await this.alertCtrl.create({
      header: 'Restablecer Clave',
      subHeader: `Usuario: ${user.fullName || user.email}`,
      inputs: [
        {
          name: 'newPassword',
          type: 'password',
          placeholder: 'Nueva contraseña (mín 4 caracteres)'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar Clave',
          handler: (data) => {
            if (!data.newPassword || data.newPassword.length < 4) {
              this.presentToast('La contraseña debe tener al menos 4 caracteres', 'warning');
              return false;
            }

            this.http.post(`/api/v1/admin/users/${user.id}/reset-password`, { newPassword: data.newPassword }).subscribe({
              next: () => this.presentToast('Contraseña restablecida exitosamente con BCrypt', 'success'),
              error: () => this.presentToast('Error al restablecer contraseña', 'danger')
            });
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  // --- ELIMINAR USUARIO ---
  async deleteUser(user: any) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar Usuario',
      message: `¿Estás seguro de que deseas eliminar permanentemente a <b>${user.fullName || user.email}</b>?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.http.delete(`/api/v1/admin/users/${user.id}`).subscribe({
              next: () => {
                this.presentToast('Usuario eliminado del sistema', 'success');
                this.loadUsers();
                this.loadStats();
              },
              error: () => this.presentToast('Error al eliminar usuario', 'danger')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  // --- CREAR MÁQUINA DE GYM ---
  async createMachine() {
    if (!this.newMachine.name || !this.newMachine.targetMuscles) {
      this.presentToast('El nombre y los músculos son obligatorios', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Guardando máquina...' });
    await loading.present();

    this.http.post('/api/v1/machines', this.newMachine).subscribe({
      next: async () => {
        await loading.dismiss();
        this.presentToast('Máquina añadida al catálogo oficial', 'success');
        this.newMachine = { name: '', targetMuscles: '', usageInstructions: '', tips: '', imageUrl: '' };
        this.loadMachines();
        this.loadStats();
      },
      error: async () => {
        await loading.dismiss();
        this.presentToast('Error al registrar máquina', 'danger');
      }
    });
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  async presentToast(message: string, color: string = 'success') {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2500,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }
}
