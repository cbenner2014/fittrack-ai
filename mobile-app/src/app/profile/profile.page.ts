import { Component, OnInit } from '@angular/core'; 
import { Router } from '@angular/router';
import { ToastController, AlertController, LoadingController, ActionSheetController, NavController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import Chart from 'chart.js/auto';

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false
})
export class ProfilePage implements OnInit {
  
  userProfile: any = {
    name: '',
    avatarUrl: '',
    gender: 'male',
    age: null,
    weight: null,
    height: null,
    activityLevel: 1.2,
    goal: 'maintain',
    dietPreference: 'Tradicional (3 a 5 comidas)'
  };

  weightHistory: any[] = [];
  newWeightLog: number | null = null;
  chart: any = null;
  newGoalLog: string = '';
  userId: string = '';
  isAdmin: boolean = false;
  isEditingProfile: boolean = false;

  getGoalLabel(goal: string): string {
    if (goal === 'lose_fat' || goal === 'LOSE_WEIGHT') return 'Quemar Grasa';
    if (goal === 'build_muscle' || goal === 'GAIN_MUSCLE') return 'Ganar Músculo';
    return 'Mantener';
  }

  getDietLabel(diet: string): string {
    if (!diet) return 'Tradicional';
    if (diet.includes('Tradicional')) return 'Tradicional';
    if (diet.includes('Ayuno')) return 'Ayuno 16/8';
    if (diet.includes('Keto') || diet.includes('Cetog')) return 'Keto';
    if (diet.includes('Paleo')) return 'Paleo';
    if (diet.includes('Vegano')) return 'Vegano';
    if (diet.includes('Vegetariano')) return 'Vegetariano';
    if (diet.includes('Carnívora') || diet.includes('Carnivora')) return 'Carnívora';
    if (diet.includes('Mediterránea') || diet.includes('Mediterranea')) return 'Mediterránea';
    return diet;
  }

  isBodyModalOpen = false;
  bodyResult: any = null;

  constructor(
    public router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private actionSheetCtrl: ActionSheetController,
    private navCtrl: NavController,
    private http: HttpClient,
    private loadingCtrl: LoadingController
  ) { }

  ngOnInit() {
    // La inicialización se maneja en ionViewWillEnter
  }

  ionViewWillEnter() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
      // Limpiar memoria de variables
      this.userId = '';
      this.userProfile = {
        name: '',
        gender: 'male',
        age: null,
        weight: null,
        height: null,
        activityLevel: 1.2,
        goal: 'maintain',
        dietPreference: 'Tradicional (3 a 5 comidas)'
      };
      this.navCtrl.navigateRoot('/login', { replaceUrl: true, animated: false });
      return;
    }

    this.userId = userId;
    this.isAdmin = localStorage.getItem('userRole') === 'ROLE_ADMIN';
    
    // Limpiamos los datos del usuario anterior por seguridad
    this.userProfile = {
      name: localStorage.getItem('userName') || '',
      gender: 'male',
      age: null,
      weight: null,
      height: null,
      activityLevel: 1.2,
      goal: 'maintain',
      dietPreference: 'Tradicional (3 a 5 comidas)'
    };
    
    this.loadProfileFromBackend();
    this.loadBodyProgress();
    
    // Cargar historial de peso localmente por ahora (hasta migrarlo si se desea)
    const savedHistory = localStorage.getItem('weightHistory');
    if (savedHistory) {
      this.weightHistory = JSON.parse(savedHistory);
      // Para propÃ³sitos de demostraciÃ³n: Si solo hay 1 registro, ya no inyectamos historial falso
      // (Eliminamos la inyecciÃ³n para que solo muestre datos reales)
    } else if (this.userProfile.weight) {
      // Si no hay historial, agregar el peso actual
      this.weightHistory.push({
        date: new Date().toISOString().split('T')[0],
        weight: this.userProfile.weight
      });
    }
  }

  loadProfileFromBackend() {
    this.http.get(`/api/v1/users/${this.userId}`).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const dbUser = res.data;
          this.userProfile.name = dbUser.fullName || '';
          this.userProfile.gender = dbUser.gender || 'male';
          this.userProfile.age = dbUser.age || null;
          this.userProfile.weight = dbUser.currentWeight || null;
          this.userProfile.height = dbUser.height || null;
          this.userProfile.activityLevel = dbUser.activityLevel || 1.2;
          
          if (dbUser.goal) {
            if (dbUser.goal === 'LOSE_WEIGHT') this.userProfile.goal = 'lose_fat';
            else if (dbUser.goal === 'GAIN_MUSCLE') this.userProfile.goal = 'build_muscle';
            else this.userProfile.goal = 'maintain';
          }
          
          this.userProfile.avatarUrl = dbUser.avatarUrl || localStorage.getItem('userAvatar') || '';
          if (this.userProfile.avatarUrl) {
            localStorage.setItem('userAvatar', this.userProfile.avatarUrl);
          }
          
          this.newWeightLog = this.userProfile.weight;
          localStorage.setItem('btrack_user_profile', JSON.stringify(this.userProfile));
        }
      },
      error: (err) => console.error("Error cargando perfil:", err)
    });
  }

  async changeAvatar() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: '📸 Foto de Perfil',
      subHeader: 'Elige tu foto de usuario',
      buttons: [
        {
          text: 'Tomar Foto con Cámara',
          icon: 'camera',
          handler: () => { this.processAvatarUpload(CameraSource.Camera); }
        },
        {
          text: 'Elegir de la Galería',
          icon: 'image',
          handler: () => { this.processAvatarUpload(CameraSource.Photos); }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async processAvatarUpload(source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: source
      });

      if (!image.base64String) return;

      const loading = await this.loadingCtrl.create({
        message: 'Actualizando tu foto de perfil...',
        spinner: 'crescent'
      });
      await loading.present();

      const byteCharacters = atob(image.base64String);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', blob, 'avatar_' + this.userId + '.jpg');

      this.http.post(`/api/v1/users/${this.userId}/avatar`, formData).subscribe({
        next: async (res: any) => {
          await loading.dismiss();
          if (res && res.avatarUrl) {
            this.userProfile.avatarUrl = res.avatarUrl;
            localStorage.setItem('userAvatar', res.avatarUrl);
          }
          const toast = await this.toastCtrl.create({
            message: '👤 ¡Foto de perfil actualizada con éxito!',
            duration: 2500,
            color: 'success',
            position: 'top'
          });
          toast.present();
        },
        error: async (err) => {
          await loading.dismiss();
          console.error('Error al subir avatar:', err);
          const toast = await this.toastCtrl.create({
            message: 'Error al subir la foto de perfil.',
            duration: 2500,
            color: 'danger',
            position: 'top'
          });
          toast.present();
        }
      });
    } catch (e) {
      console.log('Usuario canceló la selección de foto de perfil', e);
    }
  }

  ionViewDidEnter() {
    this.createChart();
  }

  createChart() {
    const ctx = document.getElementById('weightChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    if (this.chart) this.chart.destroy();

    const labels = this.weightHistory.map(entry => {
      // Formatear fecha para que sea corta ej: 11 Ago
      const d = new Date(entry.date);
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    });
    
    const data = this.weightHistory.map(entry => entry.weight);

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Peso (kg)',
          data: data,
          borderColor: '#9d00ff', // NeÃ³n purple
          backgroundColor: 'rgba(157, 0, 255, 0.2)',
          borderWidth: 3,
          pointBackgroundColor: '#00ff88',
          pointBorderColor: '#00ff88',
          pointRadius: 5,
          fill: true,
          tension: 0.4 // Curva elegante
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#ccc' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#ccc' }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  logWeight() {
    if (!this.newWeightLog) return;
    
    const today = new Date().toISOString().split('T')[0];
    const existingIndex = this.weightHistory.findIndex(entry => entry.date === today);
    
    if (existingIndex >= 0) {
      this.weightHistory[existingIndex].weight = this.newWeightLog; // Actualiza hoy
    } else {
      this.weightHistory.push({ date: today, weight: this.newWeightLog });
    }
    
    // Guardar
    localStorage.setItem('weightHistory', JSON.stringify(this.weightHistory));
    
    // Sincronizar con el perfil
    this.userProfile.weight = this.newWeightLog;
    this.saveProfile(true); // true = silencioso
    
    this.createChart(); // Redibujar
  }

  async saveProfile(silent: boolean = false) {
    if (!this.userProfile.name || !this.userProfile.age || !this.userProfile.weight || !this.userProfile.height) {
      const toast = await this.toastCtrl.create({
        message: 'Por favor, llena todos tus datos para calcular tu plan.',
        duration: 2000,
        position: 'middle',
        icon: 'alert-circle-outline'
      });
      toast.present();
      return;
    }

    // CÃ¡lculo de TMB (Tasa MetabÃ³lica Basal) - EcuaciÃ³n Mifflin-St Jeor
    let bmr = 0;
    if (this.userProfile.gender === 'male') {
      bmr = (10 * this.userProfile.weight) + (6.25 * this.userProfile.height) - (5 * this.userProfile.age) + 5;
    } else {
      bmr = (10 * this.userProfile.weight) + (6.25 * this.userProfile.height) - (5 * this.userProfile.age) - 161;
    }

    // TDEE (Gasto EnergÃ©tico Diario Total)
    let tdee = bmr * this.userProfile.activityLevel;

    // Ajuste por Objetivo
    let targetCalories = tdee;
    if (this.userProfile.goal === 'lose_fat') {
      targetCalories -= 500; // DÃ©ficit calÃ³rico
    } else if (this.userProfile.goal === 'build_muscle') {
      targetCalories += 300; // SuperÃ¡vit calÃ³rico
    }

    // CÃ¡lculos de Macros: ProteÃ­na segÃºn objetivo y actividad
    let proteinMultiplier = 1.0;
    
    if (this.userProfile.goal === 'lose_fat') {
      proteinMultiplier = 2.2; // PÃ©rdida de Peso: 2.0 - 2.4g para proteger mÃºsculo
    } else if (this.userProfile.goal === 'build_muscle') {
      proteinMultiplier = 2.0; // Ganancia muscular: 1.6 - 2.2g
    } else {
      // Mantenimiento
      if (this.userProfile.activityLevel <= 1.2) proteinMultiplier = 1.0; // Sedentario
      else if (this.userProfile.activityLevel <= 1.55) proteinMultiplier = 1.4; // Activo moderado
      else proteinMultiplier = 1.8; // Muy activo
    }

    const targetProtein = Math.round(this.userProfile.weight * proteinMultiplier);
    const proteinCalories = targetProtein * 4;

    // Grasas: 25% de las calorÃ­as totales
    const targetFats = Math.round((targetCalories * 0.25) / 9);
    const fatsCalories = targetFats * 9;

    // Carbohidratos: El resto de las calorÃ­as
    const targetCarbs = Math.round((targetCalories - proteinCalories - fatsCalories) / 4);

    const completeProfile = {
      ...this.userProfile,
      baseCalories: Math.round(tdee),
      dailyCaloriesTarget: Math.round(targetCalories),
      dailyProteinTarget: targetProtein,
      dailyCarbsTarget: targetCarbs,
      dailyFatsTarget: targetFats
    };

    this.userProfile = completeProfile; // <--- Actualizamos la variable local para que se muestre en el HTML
    localStorage.setItem('btrack_user_profile', JSON.stringify(completeProfile));
    
    // Enviar al Backend
    let backendGoal = 'MAINTAIN';
    if (this.userProfile.goal === 'lose_fat') backendGoal = 'LOSE_WEIGHT';
    else if (this.userProfile.goal === 'build_muscle') backendGoal = 'GAIN_MUSCLE';
    
    const updateDto = {
      fullName: this.userProfile.name,
      currentWeight: this.userProfile.weight,
      height: this.userProfile.height,
      age: this.userProfile.age,
      gender: this.userProfile.gender,
      activityLevel: this.userProfile.activityLevel,
      goal: backendGoal,
      baseCalories: completeProfile.baseCalories,
      dailyCaloriesTarget: completeProfile.dailyCaloriesTarget,
      dailyProteinTarget: completeProfile.dailyProteinTarget,
      dailyCarbsTarget: completeProfile.dailyCarbsTarget,
      dailyFatsTarget: completeProfile.dailyFatsTarget
    };
    
    this.http.put(`/api/v1/users/${this.userId}`, updateDto).subscribe({
      next: async (res: any) => {
        this.isEditingProfile = false;
        if (!silent) {
          const toast = await this.toastCtrl.create({
            message: '¡Perfil y macros actualizados con éxito! 🥗✨',
            duration: 2500,
            position: 'middle',
            icon: 'checkmark-circle-outline'
          });
          toast.present();
        }
      },
      error: async (err) => {
        console.error(err);
        if (!silent) {
          const toast = await this.toastCtrl.create({
            message: 'Error al guardar en el servidor',
            duration: 2000,
            position: 'middle',
            color: 'danger',
            icon: 'alert-circle-outline'
          });
          toast.present();
        }
      }
    });

    // Si no hay historial de peso, usar el peso guardado para iniciarlo
    if (this.weightHistory.length === 0 && this.userProfile.weight) {
      this.weightHistory.push({
        date: new Date().toISOString().split('T')[0],
        weight: this.userProfile.weight
      });
      localStorage.setItem('weightHistory', JSON.stringify(this.weightHistory));
      this.createChart();
    }
  }

  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que deseas salir de tu cuenta?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Sí, Salir',
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: 'Cerrando sesión de forma segura...',
              spinner: 'crescent',
              duration: 600
            });
            await loading.present();
            
            // Limpieza exhaustiva de sesión y memoria local
            localStorage.clear();
            sessionStorage.clear();
            this.userId = '';
            this.userProfile = { name: '', goal: 'maintain' };

            setTimeout(() => {
              this.navCtrl.navigateRoot('/login', { animated: true, replaceUrl: true });
            }, 300);
          }
        }
      ]
    });
    await alert.present();
  }

  async scanBody() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Escanear Físico con IA',
      buttons: [
        {
          text: 'Tomar Foto',
          icon: 'camera',
          handler: () => { this.processBodyPhoto(CameraSource.Camera); }
        },
        {
          text: 'Abrir Galería',
          icon: 'image',
          handler: () => { this.processBodyPhoto(CameraSource.Photos); }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  private async processBodyPhoto(source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: source
      });

      if (!image.base64String) return;

      const loading = await this.loadingCtrl.create({
        message: 'La IA está analizando tu físico...',
        spinner: 'crescent'
      });
      await loading.present();

      const payload = {
        base64Image: image.base64String
      };

      this.http.post('/api/v1/ai/analyze-body', payload).subscribe({
        next: (res: any) => {
          loading.dismiss();
          this.bodyResult = res;
          this.isBodyModalOpen = true;
        },
        error: async (err) => {
          loading.dismiss();
          let msg = 'Error al analizar la imagen';
          if (err && err.status === 429) {
            msg = 'Límite alcanzado: Espera un momento antes de volver a escanear tu físico.';
          } else if (err && err.error && err.error.error) {
            msg = err.error.error;
          }
          const toast = await this.toastCtrl.create({
            message: msg,
            duration: 3000,
            color: err && err.status === 429 ? 'warning' : 'danger'
          });
          toast.present();
        }
      });
    } catch (e) {
      console.log('Usuario canceló la foto', e);
    }
  }

  // --- EVOLUCIÓN CORPORAL & FOTOS PRIVADAS ---
  bodyProgressList: any[] = [];
  isLoadingProgress: boolean = false;
  isUploadProgressModalOpen: boolean = false;
  isCompareModalOpen: boolean = false;
  isViewPhotoModalOpen: boolean = false;
  selectedPhotoForView: any = null;

  newProgressPhoto: any = {
    base64: '',
    rawBase64: '',
    weight: null,
    bodyFat: null,
    notes: '',
    date: new Date().toISOString().split('T')[0]
  };

  loadBodyProgress() {
    if (!this.userId) return;
    this.isLoadingProgress = true;
    this.http.get<any[]>(`/api/v1/body-progress/user/${this.userId}`).subscribe({
      next: (data) => {
        this.isLoadingProgress = false;
        this.bodyProgressList = data || [];
      },
      error: (err) => {
        this.isLoadingProgress = false;
        console.error("Error cargando fotos de progreso:", err);
      }
    });
  }

  async openAddPhotoActionSheet() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: '📸 Registrar Foto de Progreso',
      subHeader: '🔒 Guardado 100% privado y protegido',
      buttons: [
        {
          text: 'Tomar Foto con Cámara',
          icon: 'camera',
          handler: () => { this.captureProgressPhoto(CameraSource.Camera); }
        },
        {
          text: 'Elegir de la Galería',
          icon: 'image',
          handler: () => { this.captureProgressPhoto(CameraSource.Photos); }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async captureProgressPhoto(source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: source
      });

      if (!image.base64String) return;

      this.newProgressPhoto = {
        base64: 'data:image/jpeg;base64,' + image.base64String,
        rawBase64: image.base64String,
        weight: this.userProfile.weight || null,
        bodyFat: null,
        notes: '',
        date: new Date().toISOString().split('T')[0]
      };
      this.isUploadProgressModalOpen = true;
    } catch (e) {
      console.log('Captura cancelada', e);
    }
  }

  async saveNewProgressPhoto() {
    if (!this.newProgressPhoto.rawBase64) return;

    const loading = await this.loadingCtrl.create({
      message: 'Guardando foto en tu álbum privado...',
      spinner: 'crescent'
    });
    await loading.present();

    const byteCharacters = atob(this.newProgressPhoto.rawBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', blob, 'progress_' + Date.now() + '.jpg');
    if (this.newProgressPhoto.weight) formData.append('weight', this.newProgressPhoto.weight.toString());
    if (this.newProgressPhoto.bodyFat) formData.append('bodyFat', this.newProgressPhoto.bodyFat.toString());
    if (this.newProgressPhoto.notes) formData.append('notes', this.newProgressPhoto.notes);
    if (this.newProgressPhoto.date) formData.append('date', this.newProgressPhoto.date);

    this.http.post('/api/v1/body-progress/upload', formData).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        this.isUploadProgressModalOpen = false;
        const toast = await this.toastCtrl.create({
          message: '📸 ¡Foto de evolución guardada!',
          duration: 2500,
          color: 'success',
          position: 'top'
        });
        toast.present();
        this.loadBodyProgress();
      },
      error: async (err) => {
        await loading.dismiss();
        console.error("Error subiendo foto de progreso:", err);
        const toast = await this.toastCtrl.create({
          message: 'Error al guardar la foto en el servidor.',
          duration: 2500,
          color: 'danger',
          position: 'top'
        });
        toast.present();
      }
    });
  }

  viewPhotoDetail(photo: any) {
    this.selectedPhotoForView = photo;
    this.isViewPhotoModalOpen = true;
  }

  async confirmDeleteProgress(photo: any) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar Foto',
      message: '¿Estás seguro de que deseas eliminar esta foto de tu evolución?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.http.delete(`/api/v1/body-progress/${photo.id}`).subscribe({
              next: () => {
                this.isViewPhotoModalOpen = false;
                this.bodyProgressList = this.bodyProgressList.filter(p => p.id !== photo.id);
                this.toastCtrl.create({
                  message: 'Foto eliminada correctamente.',
                  duration: 2000,
                  position: 'top'
                }).then(t => t.present());
              },
              error: (err) => console.error("Error eliminando foto:", err)
            });
          }
        }
      ]
    });
    await alert.present();
  }

  openCompareModal() {
    if (this.bodyProgressList.length < 2) {
      this.toastCtrl.create({
        message: 'Necesitas al menos 2 fotos registradas para comparar tu Antes vs Después.',
        duration: 3000,
        position: 'middle',
        color: 'warning'
      }).then(t => t.present());
      return;
    }
    this.isCompareModalOpen = true;
  }

  getBeforePhoto() {
    if (this.bodyProgressList.length === 0) return null;
    return this.bodyProgressList[this.bodyProgressList.length - 1]; // La más antigua
  }

  getAfterPhoto() {
    if (this.bodyProgressList.length === 0) return null;
    return this.bodyProgressList[0]; // La más reciente
  }

  getWeightDiff(): string {
    const before = this.getBeforePhoto();
    const after = this.getAfterPhoto();
    if (!before || !after || before.recordedWeight == null || after.recordedWeight == null) return '0 kg';
    const diff = +(after.recordedWeight - before.recordedWeight).toFixed(1);
    if (diff > 0) return `+${diff} kg`;
    return `${diff} kg`;
  }
}
