import { Component } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { HttpClient } from '@angular/common/http';
import { LoadingController, AlertController, ActionSheetController } from '@ionic/angular';
import { Router } from '@angular/router';

// @ts-ignore
import html2pdf from 'html2pdf.js';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  // Datos dinámicos del usuario actual
  userName = 'Usuario';
  userInitials: string = 'US';
  userId: string = '';

  // Variables para Modales Premium
  isFoodModalOpen = false;
  foodResult: any = null;
  todaysMeals: any[] = [];

  isMachineModalOpen = false;
  isRequestInProgress = false; // Bloqueador anti-spam
  machineResult: any = null;
  machineHistory: any[] = [];
  
  isViewingHistory = false;

  isCoachModalOpen = false;
  coachResult: any = null;

  userProfile: any = {
    name: 'Atleta',
    age: 25,
    weight: 75,
    height: 175,
    goal: 'maintain',
    baseCalories: 2500,
    dailyCaloriesTarget: 2000,
    dailyProteinTarget: 150,
    dailyCarbsTarget: 200,
    dailyFatsTarget: 65,
    totalCaloriesConsumed: 0,
    totalProteinConsumed: 0,
    totalCarbsConsumed: 0,
    totalFatsConsumed: 0
  };

  constructor(
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private actionSheetCtrl: ActionSheetController,
    public router: Router
  ) {}

  ngOnInit() {
    // Esperamos a ionViewWillEnter para tener el userId
  }

  ionViewWillEnter() {
    // Al entrar a la pantalla, cargar los datos de la sesión actual
    const storedName = localStorage.getItem('userName');
    const storedId = localStorage.getItem('userId');
    
    if (storedName) {
      this.userName = storedName.split(' ')[0]; // Solo el primer nombre
      this.userInitials = this.userName.substring(0, 2).toUpperCase();
    }
    if (storedId) {
      this.userId = storedId;
    }
    
    this.loadDailyHistory();
    this.loadProfile();
    this.loadMachineHistory();
  }

  loadProfile() {
    const savedProfile = localStorage.getItem('btrack_user_profile');
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      // Mantener los macros consumidos intactos
      this.userProfile = {
        ...this.userProfile,
        ...parsedProfile
      };
      this.userName = this.userProfile.name || 'Atleta';
    }
  }

  loadMachineHistory() {
    const saved = localStorage.getItem('machineHistory');
    if (saved) {
      this.machineHistory = JSON.parse(saved);
    }
  }

  loadDailyHistory() {
    this.http.get(`http://localhost:8080/api/v1/meals/user/${this.userId}`).subscribe({
      next: (meals: any) => {
        const today = new Date().toISOString().split('T')[0];
        this.todaysMeals = meals.filter((m: any) => m.logDate === today);
        
        let totalCals = 0;
        this.todaysMeals.forEach((m: any) => totalCals += m.totalCalories);
        
        this.userProfile.calories = totalCals;
      },
      error: (err) => console.error('Error cargando historial', err)
    });
  }

  logout() {
    // Limpiar toda la sesión y volver al login
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  // Helper para convertir Base64 a Blob (Archivo)
  private b64toBlob(b64Data: string, contentType = '', sliceSize = 512) {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  }

  async scanFood() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Escanear Comida',
      buttons: [
        { text: 'Tomar Foto', icon: 'camera', handler: () => { this.processPhoto(CameraSource.Camera, 'meals/analyze', 'comida.jpg', true); } },
        { text: 'Abrir Galería', icon: 'image', handler: () => { this.processPhoto(CameraSource.Photos, 'meals/analyze', 'comida.jpg', true); } },
        { text: 'Cancelar', icon: 'close', role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  async scanMachine() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Analizar Máquina',
      buttons: [
        { text: 'Tomar Foto', icon: 'camera', handler: () => { this.processPhoto(CameraSource.Camera, 'machines/analyze', 'maquina.jpg', false); } },
        { text: 'Abrir Galería', icon: 'image', handler: () => { this.processPhoto(CameraSource.Photos, 'machines/analyze', 'maquina.jpg', false); } },
        { text: 'Cancelar', icon: 'close', role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  // Lógica unificada para procesar la foto
  private async processPhoto(source: CameraSource, endpoint: string, fileName: string, isFood: boolean) {
    if (this.isRequestInProgress) return;
    this.isRequestInProgress = true;
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: source
      });

      if (!image.base64String) {
        this.isRequestInProgress = false;
        return;
      }

      const loading = await this.loadingCtrl.create({
        message: 'Analizando...',
        spinner: 'crescent',
        backdropDismiss: false
      });
      await loading.present();

      const blob = this.b64toBlob(image.base64String, 'image/jpeg');
      const formData = new FormData();
      formData.append('file', blob, fileName);

      this.http.post(`http://localhost:8080/api/v1/${endpoint}`, formData).subscribe({
        next: async (res: any) => {
          await loading.dismiss();
          this.isViewingHistory = false; // Modo escaneo nuevo
          if (isFood) {
            this.foodResult = res;
            this.isFoodModalOpen = true;
          } else {
            this.machineResult = res;
            this.isMachineModalOpen = true;
          }
          this.isRequestInProgress = false;
        },
        error: async (err) => {
          await loading.dismiss();
          alert('Hubo un error al conectar con la IA.');
          this.isRequestInProgress = false;
        }
      });
    } catch (e) {
      console.log('Cámara cancelada o error:', e);
      this.isRequestInProgress = false;
    }
  }

  async askCoach() {
    if (this.isRequestInProgress) return;
    this.isRequestInProgress = true;

    const loading = await this.loadingCtrl.create({
      message: 'Consultando a la IA...',
      spinner: 'lines',
      backdropDismiss: false
    });
    await loading.present();

    // Llamar a la IA con el ID del usuario actual dinámicamente
    this.http.post(`http://localhost:8080/api/v1/coach-recommendations/generate-plan/${this.userId}`, {}).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        this.coachResult = res;
        this.isCoachModalOpen = true;
        this.isRequestInProgress = false;
      },
      error: async (err) => {
        await loading.dismiss();
        let errorMsg = 'Error desconocido';
        if (err.error && err.error.error) {
           errorMsg = err.error.error;
        } else if (err.error) {
           errorMsg = JSON.stringify(err.error);
        } else {
           errorMsg = err.message;
        }
        alert('Hubo un error al conectar con la IA: ' + errorMsg);
        this.isRequestInProgress = false;
      }
    });
  }

  async saveFoodToHistory() {
    if (!this.foodResult) return;
    
    const loading = await this.loadingCtrl.create({
      message: 'Guardando...',
      spinner: 'dots'
    });
    await loading.present();

    const request = {
      userId: this.userId,
      imageUrl: this.foodResult.imageUrl,
      mealType: this.foodResult.mealType || 'SNACK',
      detectedFoods: JSON.stringify(this.foodResult.foodItems),
      totalCalories: this.foodResult.totalCalories,
      totalProtein: this.foodResult.totalProtein,
      totalCarbs: this.foodResult.totalCarbs,
      totalFats: this.foodResult.totalFats,
      logDate: new Date().toISOString().split('T')[0]
    };

    this.http.post('http://localhost:8080/api/v1/meals', request).subscribe({
      next: async () => {
        await loading.dismiss();
        this.isFoodModalOpen = false;
        this.foodResult = null;
        this.loadDailyHistory(); // Recargar la barra de progreso
      },
      error: async (err) => {
        await loading.dismiss();
        alert('Error al guardar la comida');
      }
    });
  }

  viewPastFood(meal: any) {
    this.isViewingHistory = true;
    let items = meal.detectedFoods;
    try { items = JSON.parse(meal.detectedFoods); } catch (e) {}

    this.foodResult = {
      foodItems: items,
      totalCalories: meal.totalCalories,
      totalProtein: meal.totalProtein,
      totalCarbs: meal.totalCarbs,
      totalFats: meal.totalFats,
      imageUrl: meal.imageUrl
    };
    this.isFoodModalOpen = true;
  }

  viewPastMachine(machine: any) {
    this.isViewingHistory = true;
    this.machineResult = machine;
    this.isMachineModalOpen = true;
  }

  saveMachineToHistory() {
    if (!this.machineResult) return;
    
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const todayName = days[new Date().getDay()];

    const machineEntry = {
      name: this.machineResult.name,
      targetMuscles: this.machineResult.targetMuscles,
      usageInstructions: this.machineResult.usageInstructions, // Guardando las instrucciones
      imageUrl: this.machineResult.imageUrl || 'assets/machine-placeholder.png', // Fallback
      dayOfWeek: todayName,
      date: new Date().toISOString().split('T')[0]
    };

    this.machineHistory.push(machineEntry);
    localStorage.setItem('machineHistory', JSON.stringify(this.machineHistory));
    
    this.isMachineModalOpen = false;
    this.machineResult = null;
  }

  getUniqueDays() {
    const days = this.machineHistory.map(m => m.dayOfWeek);
    return [...new Set(days)]; // Quita duplicados
  }

  getMachinesByDay(day: string) {
    return this.machineHistory.filter(m => m.dayOfWeek === day);
  }

  downloadPDF() {
    const element = document.getElementById('coach-plan-pdf');
    if (!element) return;
    
    // Clonamos el elemento para quitar las clases oscuras que afectan al PDF
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.background = '#fff';
    clone.style.color = '#000';
    
    const opt: any = {
      margin:       10,
      filename:     'Mi_Plan_Semanal_Fittrack.pdf',
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(clone).save();
  }
}
