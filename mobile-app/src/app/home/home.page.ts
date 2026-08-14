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
    totalFatsConsumed: 0,
    xp: 0,
    level: 1
  };

  selectedDate: Date = new Date();
  weekDays: any[] = [];

  // Hidratación
  waterConsumed: number = 0; // En mililitros
  waterTarget: number = 2500; // Meta por defecto

  // Misiones Diarias
  showQuests: boolean = false;
  quests = [
    { id: 'water', title: 'Modo Acuático', desc: 'Registra al menos 2L de agua', xp: 50, icon: 'water', color: '#00d2ff' },
    { id: 'food', title: 'Nutrición IA', desc: 'Escanea 1 comida hoy', xp: 100, icon: 'restaurant', color: '#ff9d00' },
    { id: 'machine', title: 'Cazador de Hierro', desc: 'Analiza 1 máquina hoy', xp: 75, icon: 'barbell', color: '#9d00ff' }
  ];
  claimedQuests: string[] = [];

  // CHAT
  isChatModalOpen = false;
  chatMessage = '';
  chatHistory: {role: string, text: string}[] = [];

  // ETIQUETAS
  isLabelModalOpen = false;
  labelResult: any = null;

  constructor(
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private actionSheetCtrl: ActionSheetController,
    public router: Router
  ) {}

  ngOnInit() {
    this.userId = localStorage.getItem('userId') || '2';
    this.generateWeek();
    this.loadDailyHistory();
    this.loadProfile();
  }

  ionViewWillEnter() {
    // Al entrar a la pantalla, cargar los datos de la sesión actual
    this.userId = localStorage.getItem('userId') || '2';
    const storedName = localStorage.getItem('userName');
    
    if (storedName) {
      this.userName = storedName.split(' ')[0]; // Solo el primer nombre
      this.userInitials = this.userName.substring(0, 2).toUpperCase();
    }
    
    this.loadDailyHistory();
    this.loadProfile();
    this.loadMachineHistory();
  }

  loadProfile() {
    // 1. Cargar rápido de memoria local
    const savedProfile = localStorage.getItem('btrack_user_profile');
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      this.userProfile = {
        ...this.userProfile,
        ...parsedProfile
      };
      this.userName = this.userProfile.name ? this.userProfile.name.split(' ')[0] : 'Atleta';
      this.userInitials = this.userName.substring(0, 2).toUpperCase();
    }
    
    // 2. Traer del servidor silenciosamente para mantener actualizado (XP, Nivel, etc)
    this.http.get(`http://localhost:8080/api/v1/users/${this.userId}`).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const dbUser = res.data;
          this.userName = dbUser.fullName ? dbUser.fullName.split(' ')[0] : 'Atleta';
          this.userInitials = this.userName.substring(0, 2).toUpperCase();
          this.userProfile.dailyCaloriesTarget = dbUser.dailyCaloriesTarget || 2000;
          this.userProfile.dailyProteinTarget = dbUser.dailyProteinTarget || 150;
          this.userProfile.dailyCarbsTarget = dbUser.dailyCarbsTarget || 200;
          this.userProfile.dailyFatsTarget = dbUser.dailyFatsTarget || 60;
          this.userProfile.level = dbUser.level || 1;
          this.userProfile.xp = dbUser.xp || 0;
          
          if (dbUser.goal) {
            this.userProfile.goalText = dbUser.goal === 'LOSE_WEIGHT' ? 'Perder Peso' : dbUser.goal === 'GAIN_MUSCLE' ? 'Ganar Masa' : 'Mantener Peso';
          }
        }
      },
      error: (err) => console.error(err)
    });
  }

  loadMachineHistory() {
    this.http.get(`http://localhost:8080/api/v1/machine-logs/user/${this.userId}`).subscribe({
      next: (machines: any) => {
        this.machineHistory = machines.map((m: any) => {
          // Obtener nombre del día
          const dateObj = new Date(m.logDate + 'T12:00:00Z'); // Ajuste de zona horaria
          let dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
          dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1); // Capitalizar

          return {
            id: m.id,
            name: m.machineName,
            targetMuscles: m.targetMuscle,
            usageInstructions: m.instructions,
            imageUrl: m.imageUrl,
            date: m.logDate,
            dayOfWeek: dayName
          };
        });
        this.updateHydrationTarget();
      },
      error: (err) => console.error('Error cargando historial de máquinas', err)
    });
  }

  generateWeek() {
    this.weekDays = [];
    const today = new Date();
    // Generar 3 días antes y 3 días después
    for (let i = -3; i <= 3; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      this.weekDays.push({
        date: d,
        dayName: ['D', 'L', 'M', 'M', 'J', 'V', 'S'][d.getDay()],
        dayNumber: d.getDate(),
        fullDateString: d.toISOString().split('T')[0],
        isToday: i === 0,
        hasData: false
      });
    }
  }

  selectDate(day: any) {
    this.selectedDate = day.date;
    this.loadDailyHistory(day.fullDateString);
  }

  loadDailyHistory(targetDateString?: string) {
    const target = targetDateString || this.selectedDate.toISOString().split('T')[0];

    this.http.get(`http://localhost:8080/api/v1/meals/user/${this.userId}`).subscribe({
      next: (meals: any) => {
        // Iluminar puntos verdes si hay datos en ese día
        this.weekDays.forEach(day => {
          day.hasData = meals.some((m: any) => m.logDate === day.fullDateString);
        });

        // Cargar agua para el día seleccionado
        const savedWater = localStorage.getItem(`water_${this.userId}_${target}`);
        this.waterConsumed = savedWater ? parseInt(savedWater, 10) : 0;

        this.todaysMeals = meals.filter((m: any) => m.logDate === target);
        
        let totalCals = 0;
        let totalProt = 0;
        let totalCarbs = 0;
        let totalFats = 0;
        this.todaysMeals.forEach((m: any) => {
           totalCals += m.totalCalories || 0;
           totalProt += m.totalProtein || 0;
           totalCarbs += m.totalCarbs || 0;
           totalFats += m.totalFats || 0;
        });
        
        this.userProfile.totalCaloriesConsumed = totalCals;
        this.userProfile.totalProteinConsumed = Math.round(totalProt);
        this.userProfile.totalCarbsConsumed = Math.round(totalCarbs);
        this.userProfile.totalFatsConsumed = Math.round(totalFats);
        
        
        this.updateHydrationTarget();
        
        this.updateHydrationTarget();
        this.evaluateQuests();
      },
      error: (err) => console.error('Error cargando historial', err)
    });
  }

  // --- SISTEMA DE GAMIFICACIÓN ---
  evaluateQuests() {
    const todayStr = new Date().toISOString().split('T')[0];
    const savedClaimed = localStorage.getItem(`quests_${this.userId}_${todayStr}`);
    this.claimedQuests = savedClaimed ? JSON.parse(savedClaimed) : [];
  }

  isQuestDone(questId: string): boolean {
    if (questId === 'water') return this.waterConsumed >= 2000;
    if (questId === 'food') return this.todaysMeals && this.todaysMeals.length > 0;
    if (questId === 'machine') {
      const todayStr = new Date().toISOString().split('T')[0];
      return this.machineHistory.some(m => m.date === todayStr);
    }
    return false;
  }

  isQuestClaimed(questId: string): boolean {
    return this.claimedQuests.includes(questId);
  }

  claimQuest(quest: any) {
    if (!this.isQuestDone(quest.id) || this.isQuestClaimed(quest.id)) return;
    
    // Dar recompensa
    this.userProfile.xp = (this.userProfile.xp || 0) + quest.xp;
    
    // Verificar si sube de nivel (cada 300 XP sube 1 nivel)
    const xpNeeded = this.userProfile.level * 300;
    if (this.userProfile.xp >= xpNeeded) {
      this.userProfile.level++;
      this.userProfile.xp -= xpNeeded; // Deja el residuo
      this.showLevelUpAlert();
    }
    
    // Guardar estado
    this.claimedQuests.push(quest.id);
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem(`quests_${this.userId}_${todayStr}`, JSON.stringify(this.claimedQuests));
    
    // Guardar perfil
    localStorage.setItem('btrack_user_profile', JSON.stringify(this.userProfile));
  }

  async showLevelUpAlert() {
    const alert = await this.alertCtrl.create({
      header: '¡SUBISTE DE NIVEL!',
      message: `Has alcanzado el Nivel ${this.userProfile.level}. ¡Eres una bestia! Sigue así.`,
      buttons: ['¡A TRITURAR!'],
      cssClass: 'neon-alert'
    });
    await alert.present();
  }

  get userRank() {
    const lvl = this.userProfile.level || 1;
    if (lvl < 5) return { name: 'Bronce', icon: 'medal', color: '#cd7f32', title: 'Novato' };
    if (lvl < 15) return { name: 'Plata', icon: 'medal', color: '#c0c0c0', title: 'Constante' };
    if (lvl < 30) return { name: 'Oro', icon: 'medal', color: '#ffd700', title: 'Atleta' };
    return { name: 'Diamante', icon: 'diamond', color: '#00ffff', title: 'Imparable' };
  }
  // ---------------------------------

  // --- HIDRATACIÓN ---
  updateHydrationTarget() {
    let weight = this.userProfile.weight || 70; // 70kg por defecto
    let base = weight * 35; // 35ml por kg
    
    // Sumar 500ml si ha entrenado este día
    const targetDate = this.selectedDate.toISOString().split('T')[0];
    const workedOut = this.machineHistory.some(m => m.date === targetDate);
    if (workedOut) {
      base += 500;
    }
    
    this.waterTarget = base;
  }

  // --- COMPRAS ---
  async generateShoppingList() {
    if (!this.coachResult || !this.coachResult.nutritionPlan) {
      alert("Primero genera tu plan semanal.");
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Creando lista de mercado...',
      spinner: 'dots'
    });
    await loading.present();

    const payload = {
      nutritionPlan: this.coachResult.nutritionPlan
    };

    this.http.post('http://localhost:8080/api/v1/coach-recommendations/generate-shopping-list', payload).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        
        // El AI devuelve JSON. Lo parseamos
        let parsedList: any;
        if (typeof res === 'string') {
           try { parsedList = JSON.parse(res); } catch(e) { parsedList = res; }
        } else {
           parsedList = res;
        }

        if (parsedList && parsedList.shoppingList) {
          // Guardarlo en coachResult para mostrar en UI
          this.coachResult.shoppingList = parsedList.shoppingList;
        } else {
          alert('No se pudo estructurar la lista.');
        }
      },
      error: async (err) => {
        await loading.dismiss();
        
        if (err.error && typeof err.error === 'string') {
          try {
             const p = JSON.parse(err.error);
             if (p.shoppingList) {
               this.coachResult.shoppingList = p.shoppingList;
               return;
             }
             if (p.error) {
               alert('Error de IA: ' + p.error);
               return;
             }
          } catch(e) {}
        } else if (err.error && err.error.error) {
           alert('Error de IA: ' + err.error.error);
           return;
        }
        
        alert('Hubo un error al crear la lista de compras: ' + JSON.stringify(err));
      }
    });
  }

  addWater(amount: number) {
    this.waterConsumed += amount;
    if (this.waterConsumed < 0) this.waterConsumed = 0; // No valores negativos
    
    const targetDate = this.selectedDate.toISOString().split('T')[0];
    localStorage.setItem(`water_${this.userId}_${targetDate}`, this.waterConsumed.toString());
    this.evaluateQuests();
  }

  get waterProgressPercentage() {
    return Math.min((this.waterConsumed / this.waterTarget) * 100, 100);
  }

  getMealsByType(type: string) {
    return this.todaysMeals.filter(m => m.mealType === type);
  }

  getMealTypeMacros(type: string) {
    const meals = this.getMealsByType(type);
    let cals = 0, p = 0, c = 0, f = 0;
    meals.forEach(m => {
      cals += m.totalCalories || 0;
      p += m.totalProtein || 0;
      c += m.totalCarbs || 0;
      f += m.totalFats || 0;
    });
    return { cals, p: Math.round(p), c: Math.round(c), f: Math.round(f) };
  }

  formatFoodName(foodString: string): string {
    if (!foodString) return 'Comida Desconocida';
    try {
      const parsed = JSON.parse(foodString);
      if (Array.isArray(parsed)) {
        return parsed.join(', ');
      }
      return parsed.toString();
    } catch (e) {
      // Remover llaves o corchetes si es un string sucio
      return foodString.replace(/[\[\]"]/g, '');
    }
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

  async scanLabel() {
    if (this.isRequestInProgress) return;
    this.isRequestInProgress = true;

    try {
      // Capacitor Camera handles both Web and Native gracefully
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt,
        quality: 90
      });
      let base64Image = photo.base64String;

      if (!base64Image) {
        this.isRequestInProgress = false;
        return;
      }

      const loading = await this.loadingCtrl.create({
        message: 'Buscando engaños...',
        spinner: 'bubbles',
        backdropDismiss: false
      });
      await loading.present();

      const profileStr = localStorage.getItem('btrack_user_profile');
      let dietPref = 'Ninguna';
      if (profileStr) {
        const p = JSON.parse(profileStr);
        if (p.dietPreference) dietPref = p.dietPreference;
      }

      const url = `http://localhost:8080/api/v1/ai/analyze-label?dietPreference=${encodeURIComponent(dietPref)}`;
      this.http.post(url, {
        base64Image: base64Image
      }).subscribe({
        next: async (res: any) => {
          await loading.dismiss();
          // parse JSON string to Object
          this.labelResult = typeof res === 'string' ? JSON.parse(res) : res;
          this.isLabelModalOpen = true;
          this.isRequestInProgress = false;
        },
        error: async (err) => {
          await loading.dismiss();
          
          if (err.error && typeof err.error === 'string') {
            try {
              this.labelResult = JSON.parse(err.error);
              this.isLabelModalOpen = true;
              this.isRequestInProgress = false;
              return;
            } catch (e) {}
          }
          
          alert('Hubo un error al leer la etiqueta.');
          this.isRequestInProgress = false;
        }
      });
    } catch (e) {
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

    const profileStr = localStorage.getItem('btrack_user_profile');
    let dietPref = 'Tradicional (3 a 5 comidas)';
    if (profileStr) {
      const p = JSON.parse(profileStr);
      if (p.dietPreference) dietPref = p.dietPreference;
    }

    // Llamar a la IA con el ID del usuario actual dinámicamente y la dieta elegida
    const url = `http://localhost:8080/api/v1/coach-recommendations/generate-plan/${this.userId}?dietPreference=${encodeURIComponent(dietPref)}`;
    this.http.post(url, {}).subscribe({
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

  async deleteFoodFromHistory() {
    if (!this.foodResult || !this.foodResult.id) return;
    
    const loading = await this.loadingCtrl.create({
      message: 'Eliminando...',
      spinner: 'dots'
    });
    await loading.present();

    this.http.delete(`http://localhost:8080/api/v1/meals/${this.foodResult.id}`).subscribe({
      next: async () => {
        await loading.dismiss();
        this.isFoodModalOpen = false;
        this.foodResult = null;
        this.loadDailyHistory(); // Recargar la lista y la barra de progreso
      },
      error: async (err) => {
        await loading.dismiss();
        alert('Error al eliminar la comida');
      }
    });
  }

  viewPastFood(meal: any) {
    this.isViewingHistory = true;
    let items = meal.detectedFoods;
    try { items = JSON.parse(meal.detectedFoods); } catch (e) {}

    this.foodResult = {
      id: meal.id, // IMPORTANTE para borrar
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

  async saveMachineToHistory() {
    if (!this.machineResult) return;
    
    const loading = await this.loadingCtrl.create({
      message: 'Guardando en la nube...',
      spinner: 'dots'
    });
    await loading.present();

    const request = {
      userId: this.userId,
      machineName: this.machineResult.name,
      targetMuscle: this.machineResult.targetMuscles,
      instructions: this.machineResult.usageInstructions,
      tips: this.machineResult.tips || '',
      imageUrl: this.machineResult.imageUrl || 'assets/machine-placeholder.png',
      logDate: new Date().toISOString().split('T')[0]
    };

    this.http.post('http://localhost:8080/api/v1/machine-logs', request).subscribe({
      next: async () => {
        await loading.dismiss();
        this.isMachineModalOpen = false;
        this.machineResult = null;
        this.loadMachineHistory(); // Recargar de la base de datos
        this.evaluateQuests(); // Evaluar misiones
      },
      error: async (err) => {
        await loading.dismiss();
        alert('Error al guardar la máquina en la nube');
      }
    });
  }

  getUniqueDays() {
    const days = this.machineHistory.map(m => m.dayOfWeek);
    return [...new Set(days)]; // Quita duplicados
  }

  getMachinesByDay(day: string) {
    return this.machineHistory.filter(m => m.dayOfWeek === day);
  }

  downloadPDF() {
    if (!this.coachResult) return;
    
    // Crear una plantilla HTML hermosa y limpia para el PDF
    const pdfHtml = `
      <div style="padding: 40px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; background-color: #f9f9fb; max-width: 800px; margin: auto;">
        
        <!-- Header -->
        <div style="text-align: center; border-bottom: 2px solid #00ff88; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #1a1a1a; margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px;">Plan de Acción B-Track</h1>
          <p style="color: #666; font-size: 14px; margin-top: 5px;">Personalizado para ${this.userName}</p>
        </div>

        <!-- Mensaje Motivacional -->
        <div style="background-color: #e5fff2; border-left: 4px solid #00ff88; padding: 15px 20px; border-radius: 4px; margin-bottom: 30px;">
          <p style="margin: 0; font-style: italic; color: #005a30; font-size: 16px;">
            "${this.coachResult.message}"
          </p>
        </div>

        <!-- Sección de Rutina -->
        <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 25px;">
          <h2 style="color: #000; font-size: 20px; margin-top: 0; display: flex; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 10px;">
             💪 Plan de Entrenamiento
          </h2>
          <p style="color: #444; font-size: 14px; line-height: 1.6; white-space: pre-wrap; margin-bottom: 0;">${this.coachResult.workoutPlan}</p>
        </div>

        <!-- Sección de Nutrición -->
        <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #000; font-size: 20px; margin-top: 0; display: flex; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 10px;">
             🥗 Guía de Nutrición
          </h2>
          <p style="color: #444; font-size: 14px; line-height: 1.6; white-space: pre-wrap; margin-bottom: 0;">${this.coachResult.nutritionPlan}</p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; color: #aaa; font-size: 12px;">
          Generado por B-Track AI Coach
        </div>
      </div>
    `;

    // Crear un contenedor temporal invisible para html2pdf
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = pdfHtml;
    
    const opt: any = {
      margin:       0,
      filename:     `Plan_BTrack_${this.userName}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(tempDiv).save();
  }

  toggleQuests() {
    this.showQuests = !this.showQuests;
  }

  // CHAT SOS
  async sendChatMessage() {
    if (!this.chatMessage.trim()) return;

    // Agregar mensaje del usuario a la UI
    const userMsg = this.chatMessage;
    this.chatHistory.push({ role: 'user', text: userMsg });
    this.chatMessage = '';

    const loading = await this.loadingCtrl.create({
      message: 'Escribiendo...',
      spinner: 'dots'
    });
    await loading.present();

    const profileStr = localStorage.getItem('btrack_user_profile');
    let dietPref = 'Ninguna';
    if (profileStr) {
      const p = JSON.parse(profileStr);
      if (p.dietPreference) dietPref = p.dietPreference;
    }

    const payload = {
      message: userMsg,
      dietPreference: dietPref
    };

    this.http.post('http://localhost:8080/api/v1/ai/chat', payload).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        if (res.reply) {
          this.chatHistory.push({ role: 'ai', text: res.reply });
        } else if (res.text) {
          this.chatHistory.push({ role: 'ai', text: res.text });
        } else {
          // Si el JSON viene parseado diferente o como texto plano
          let parsed;
          try {
             parsed = JSON.parse(res);
             if (parsed.reply) this.chatHistory.push({ role: 'ai', text: parsed.reply });
          } catch(e) {
             this.chatHistory.push({ role: 'ai', text: res });
          }
        }
      },
      error: async (err) => {
        await loading.dismiss();
        
        // El servidor devuelve un string que a veces httpClient no sabe parsear como JSON si viene texto directo.
        if (err.error && typeof err.error === 'string') {
          try {
            const parsed = JSON.parse(err.error);
            if (parsed.reply) {
              this.chatHistory.push({ role: 'ai', text: parsed.reply });
              return;
            }
          } catch (e) {}
        }
        
        alert('Hubo un error de conexión con la IA.');
      }
    });
  }
}
