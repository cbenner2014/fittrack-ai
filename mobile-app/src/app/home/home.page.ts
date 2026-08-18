import { Component } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { HttpClient } from '@angular/common/http';
import { LoadingController, AlertController, ActionSheetController, NavController } from '@ionic/angular';
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
  // Datos dinÃ¡micos del usuario actual
  userName = 'Usuario';
  userInitials: string = 'US';
  userId: string = '';
  isAdmin: boolean = false;

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

  // MODAL INDEPENDIENTE DE LISTA DE COMPRAS
  isShoppingListModalOpen = false;
  shoppingListResult: any = null;

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

  // HidrataciÃ³n
  waterConsumed: number = 0; // En mililitros
  waterTarget: number = 2500; // Meta por defecto

  // Misiones Diarias
  showQuests: boolean = false;
  quests = [
    { id: 'water', title: 'Modo AcuÃ¡tico', desc: 'Registra al menos 2L de agua', xp: 50, icon: 'water', color: '#00d2ff' },
    { id: 'food', title: 'NutriciÃ³n IA', desc: 'Escanea 1 comida hoy', xp: 100, icon: 'restaurant', color: '#ff9d00' },
    { id: 'machine', title: 'Cazador de Hierro', desc: 'Analiza 1 mÃ¡quina hoy', xp: 75, icon: 'barbell', color: '#9d00ff' }
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
    private navCtrl: NavController,
    public router: Router
  ) {}

  ngOnInit() {
    this.checkSessionAndLoad();
  }

  ionViewWillEnter() {
    this.checkSessionAndLoad();
  }

  private checkSessionAndLoad() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) {
      // Limpiar memoria de variables por seguridad
      this.userId = '';
      this.userName = '';
      this.todaysMeals = [];
      this.machineHistory = [];
      this.userProfile = {
        name: '',
        gender: 'male',
        age: 25,
        weight: 70,
        height: 175,
        activityLevel: 1.2,
        goal: 'lose_fat',
        goalText: 'Perder Grasa',
        baseCalories: 2000,
        dailyCaloriesTarget: 2200,
        dailyProteinTarget: 160,
        dailyCarbsTarget: 220,
        dailyFatsTarget: 70,
        totalCaloriesConsumed: 0,
        totalProteinConsumed: 0,
        totalCarbsConsumed: 0,
        totalFatsConsumed: 0,
        level: 1,
        xp: 0
      };
      this.navCtrl.navigateRoot('/login', { replaceUrl: true, animated: false });
      return;
    }

    this.userId = userId;
    this.isAdmin = localStorage.getItem('userRole') === 'ROLE_ADMIN';
    const storedName = localStorage.getItem('userName');
    
    if (storedName) {
      this.userName = storedName.split(' ')[0];
      this.userInitials = this.userName.substring(0, 2).toUpperCase();
    }
    
    this.generateWeek();
    this.loadDailyHistory();
    this.loadProfile();
    this.loadMachineHistory();
  }

  loadProfile() {
    // 1. Cargar rÃ¡pido de memoria local
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
    this.http.get(`/api/v1/users/${this.userId}`).subscribe({
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
    this.http.get(`/api/v1/machine-logs/user/${this.userId}`).subscribe({
      next: (machines: any) => {
        this.machineHistory = machines.map((m: any) => {
          // Obtener nombre del dÃ­a
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
      error: (err) => console.error('Error cargando historial de mÃ¡quinas', err)
    });
  }

  generateWeek() {
    this.weekDays = [];
    const today = new Date();
    // Generar 3 dÃ­as antes y 3 dÃ­as despuÃ©s
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

    this.http.get(`/api/v1/meals/user/${this.userId}`).subscribe({
      next: (meals: any) => {
        // Iluminar puntos verdes si hay datos en ese dÃ­a
        this.weekDays.forEach(day => {
          day.hasData = meals.some((m: any) => m.logDate === day.fullDateString);
        });

        // Cargar agua para el dÃ­a seleccionado
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

  // --- SISTEMA DE GAMIFICACIÃ“N ---
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
    
    this.http.post(`/api/v1/users/${this.userId}/add-xp?amount=${quest.xp}`, {}).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const oldLevel = this.userProfile.level || 1;
          this.userProfile.xp = res.data.xp;
          this.userProfile.level = res.data.level;
          
          if (res.data.level > oldLevel) {
            this.showLevelUpAlert();
          }
          
          this.claimedQuests.push(quest.id);
          const todayStr = new Date().toISOString().split('T')[0];
          localStorage.setItem(`quests_${this.userId}_${todayStr}`, JSON.stringify(this.claimedQuests));
          localStorage.setItem('btrack_user_profile', JSON.stringify(this.userProfile));
        }
      },
      error: (err) => console.error('Error sumando XP:', err)
    });
  }

  async showLevelUpAlert() {
    const alert = await this.alertCtrl.create({
      header: 'Â¡SUBISTE DE NIVEL!',
      message: `Has alcanzado el Nivel ${this.userProfile.level}. Â¡Eres una bestia! Sigue asÃ­.`,
      buttons: ['Â¡A TRITURAR!'],
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

  // --- HIDRATACIÃ“N ---
  updateHydrationTarget() {
    let weight = this.userProfile.weight || 70; // 70kg por defecto
    let base = weight * 35; // 35ml por kg
    
    // Sumar 500ml si ha entrenado este dÃ­a
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
      message: 'Organizando tu lista de supermercado...',
      spinner: 'dots'
    });
    await loading.present();

    const payload = {
      nutritionPlan: this.coachResult.nutritionPlan
    };

    this.http.post('/api/v1/coach-recommendations/generate-shopping-list', payload).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        
        let parsedList: any;
        if (typeof res === 'string') {
           try { parsedList = JSON.parse(res); } catch (e) { parsedList = res; }
        } else {
           parsedList = res;
        }

        if (parsedList && parsedList.shoppingList) {
          this.shoppingListResult = parsedList.shoppingList;
          this.isShoppingListModalOpen = true; // Abre en su propia ventana dedicada
        } else {
          alert('No se pudo estructurar la lista.');
        }
      },
      error: async (err) => {
        await loading.dismiss();
        // Si viene el JSON dentro de error.text
        if (err && err.error && typeof err.error.text === 'string') {
          try {
            const parsed = JSON.parse(err.error.text);
            if (parsed && parsed.shoppingList) {
              this.shoppingListResult = parsed.shoppingList;
              this.isShoppingListModalOpen = true;
              return;
            }
          } catch (e) {}
        }
        this.showAiErrorAlert(err, 'Hubo un error al crear la lista de compras.');
      }
    });
  }

  downloadShoppingListPDF() {
    if (!this.shoppingListResult || !Array.isArray(this.shoppingListResult)) return;

    const todayDate = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

    let categoriesHtml = '';
    this.shoppingListResult.forEach((cat: any) => {
      let itemsHtml = '';
      if (cat.items && Array.isArray(cat.items)) {
        cat.items.forEach((item: string) => {
          itemsHtml += `
            <div style="display: flex; align-items: center; padding: 7px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13.5px; color: #334155;">
              <span style="display: inline-block; width: 14px; height: 14px; border: 1.5px solid #64748b; border-radius: 3px; margin-right: 12px;"></span>
              <span>${item}</span>
            </div>
          `;
        });
      }

      categoriesHtml += `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin-bottom: 16px; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
          <h3 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #fef08a; padding-bottom: 6px;">
            🛒 ${cat.category}
          </h3>
          <div style="display: flex; flex-direction: column;">
            ${itemsHtml}
          </div>
        </div>
      `;
    });

    const pdfHtml = `
      <div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background: #ffffff; padding: 32px; max-width: 780px; margin: 0 auto;">
        
        <!-- Header Banner Premium -->
        <div style="background: linear-gradient(135deg, #1c1917 0%, #292524 100%); border-radius: 16px; padding: 24px 28px; color: #ffffff; margin-bottom: 20px; border: 1px solid #44403c;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 11px; font-weight: 700; color: #fbbf24; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px;">
                B-TRACK AI • CHECKLIST DE SUPERMERCADO
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Lista de Compras Semanal
              </h1>
              <div style="font-size: 13px; color: #a8a29e; margin-top: 4px;">
                Personalizada para: <span style="color: #ffffff; font-weight: 600;">${this.userName}</span>
              </div>
            </div>
            <div style="text-align: right; background: rgba(255,255,255,0.08); padding: 10px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);">
              <div style="font-size: 10px; text-transform: uppercase; color: #d6d3d1; font-weight: 700;">Fecha</div>
              <div style="font-size: 13px; font-weight: 700; color: #fbbf24;">${todayDate}</div>
            </div>
          </div>
        </div>

        <div style="background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: #92400e;">
          💡 <strong>Tip de compra:</strong> Las cantidades están agrupadas para toda la semana para que compres por volumen y no tengas sobras innecesarias.
        </div>

        <!-- Categorías -->
        ${categoriesHtml}

        <!-- Footer -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; display: flex; justify-content: space-between; align-items: center; color: #94a3b8; font-size: 11px; margin-top: 20px;">
          <div>B-Track AI • Supermarket Smart Checklist</div>
          <div>¡A cumplir tus metas de nutrición! 🥗💪</div>
        </div>
      </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = pdfHtml;

    const opt: any = {
      margin:       [8, 8, 8, 8],
      filename:     `Lista_Compras_${this.userName.replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(tempDiv).save();
  }

  async copyShoppingList() {
    if (!this.shoppingListResult || !Array.isArray(this.shoppingListResult)) return;

    let text = `🛒 *LISTA DE COMPRAS SEMANAL B-TRACK*\n👤 Atleta: ${this.userName}\n\n`;
    this.shoppingListResult.forEach((cat: any) => {
      text += `📦 *${cat.category.toUpperCase()}*\n`;
      if (cat.items && Array.isArray(cat.items)) {
        cat.items.forEach((item: string) => {
          text += `  ▫️ ${item}\n`;
        });
      }
      text += `\n`;
    });
    text += `_Generado por B-Track AI Coach_`;

    try {
      await navigator.clipboard.writeText(text);
      const alert = await this.alertCtrl.create({
        header: '¡Copiado!',
        message: 'La lista de compras se copió al portapapeles. ¡Pégala directamente en WhatsApp!',
        buttons: ['GENIAL'],
        cssClass: 'neon-alert'
      });
      await alert.present();
    } catch (e) {
      alert('Lista copiada:\n\n' + text);
    }
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
    // Limpiar toda la sesiÃ³n y volver al login
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

  // LÃ³gica unificada para procesar la foto
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

      this.http.post(`/api/v1/${endpoint}`, formData).subscribe({
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
          this.showAiErrorAlert(err, 'Hubo un error al procesar el análisis con la IA.');
          this.isRequestInProgress = false;
        }
      });
    } catch (e) {
      console.log('CÃ¡mara cancelada o error:', e);
      this.isRequestInProgress = false;
    }
  }

  async scanLabel() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Escanear Etiqueta Nutricional',
      buttons: [
        { 
          text: 'Tomar Foto', 
          icon: 'camera', 
          handler: () => { this.processLabelPhoto(CameraSource.Camera); } 
        },
        { 
          text: 'Abrir Galería', 
          icon: 'image', 
          handler: () => { this.processLabelPhoto(CameraSource.Photos); } 
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

  private async processLabelPhoto(source: CameraSource) {
    if (this.isRequestInProgress) return;
    this.isRequestInProgress = true;

    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        source: source,
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

      const url = `/api/v1/ai/analyze-label?dietPreference=${encodeURIComponent(dietPref)}`;
      this.http.post(url, {
        base64Image: base64Image
      }).subscribe({
        next: async (res: any) => {
          await loading.dismiss();
          this.labelResult = typeof res === 'string' ? JSON.parse(res) : res;
          this.isLabelModalOpen = true;
          this.isRequestInProgress = false;
        },
        error: async (err) => {
          await loading.dismiss();
          this.showAiErrorAlert(err, 'Hubo un error al leer la etiqueta.');
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

    const profileStr = localStorage.getItem('btrack_user_profile');
    let dietPref = 'Tradicional (3 a 5 comidas)';
    if (profileStr) {
      const p = JSON.parse(profileStr);
      if (p.dietPreference) dietPref = p.dietPreference;
    }

    // Llamar a la IA con el ID del usuario actual dinámicamente y la dieta elegida
    const url = `/api/v1/coach-recommendations/generate-plan/${this.userId}?dietPreference=${encodeURIComponent(dietPref)}`;
    this.http.post(url, {}).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        let parsed = res;
        if (typeof res === 'string') {
          try { parsed = JSON.parse(res); } catch (e) { parsed = res; }
        }
        this.coachResult = parsed;
        this.isCoachModalOpen = true;
        this.isRequestInProgress = false;
      },
      error: async (err) => {
        await loading.dismiss();
        // Si el backend devolvió el JSON exitosamente pero Angular no lo parseó por el header
        if (err && err.error && typeof err.error.text === 'string') {
          try {
            const parsed = JSON.parse(err.error.text);
            if (parsed && (parsed.workoutPlan || parsed.nutritionPlan || parsed.recommendationType)) {
              this.coachResult = parsed;
              this.isCoachModalOpen = true;
              this.isRequestInProgress = false;
              return;
            }
          } catch (e) {}
        }
        this.showAiErrorAlert(err, 'Hubo un error al generar tu plan con la IA.');
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

    this.http.post('/api/v1/meals', request).subscribe({
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

    this.http.delete(`/api/v1/meals/${this.foodResult.id}`).subscribe({
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

    this.http.post('/api/v1/machine-logs', request).subscribe({
      next: async () => {
        await loading.dismiss();
        this.isMachineModalOpen = false;
        this.machineResult = null;
        this.loadMachineHistory(); // Recargar de la base de datos
        this.evaluateQuests(); // Evaluar misiones
      },
      error: async (err) => {
        await loading.dismiss();
        alert('Error al guardar la mÃ¡quina en la nube');
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

    const todayDate = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    const goalName = this.userProfile?.goalText || (this.userProfile?.goal === 'lose_fat' ? 'Perder Grasa' : this.userProfile?.goal === 'build_muscle' ? 'Ganar Masa Muscular' : 'Mantenimiento y Salud');
    const caloriesTarget = this.userProfile?.dailyCaloriesTarget ? `${this.userProfile.dailyCaloriesTarget} kcal` : 'Personalizado';

    // Plantilla de diseño ultra premium para el PDF (Colores de marca B-Track: Oscuro, Neón Esmeralda, Cúrcuma y Blanco)
    const pdfHtml = `
      <div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background: #ffffff; padding: 32px; max-width: 780px; margin: 0 auto;">
        
        <!-- Header Banner Premium -->
        <div style="background: linear-gradient(135deg, #090d16 0%, #111827 100%); border-radius: 16px; padding: 28px 32px; color: #ffffff; margin-bottom: 24px; border: 1px solid #1e293b; position: relative;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 11px; font-weight: 700; color: #00ff88; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px;">
                B-TRACK AI COACH • REPORTE OFICIAL
              </div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Plan de Rendimiento Semanal
              </h1>
              <div style="font-size: 13px; color: #94a3b8; margin-top: 6px;">
                Personalizado para: <span style="color: #ffffff; font-weight: 600;">${this.userName}</span>
              </div>
            </div>
            <div style="text-align: right; background: rgba(255,255,255,0.05); padding: 12px 18px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
              <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 1px;">Objetivo</div>
              <div style="font-size: 14px; font-weight: 700; color: #00ff88;">${goalName}</div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Meta: ${caloriesTarget}</div>
            </div>
          </div>
        </div>

        <!-- Mensaje Motivacional del Coach -->
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 5px solid #00ff88; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
          <div style="font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
            Mensaje de tu Coach
          </div>
          <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #14532d; font-style: italic;">
            "${this.coachResult.message || 'La disciplina constante es la clave para alcanzar tu mejor versión física y mental.'}"
          </p>
        </div>

        <!-- Sección 1: Plan de Entrenamiento -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 22px 24px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
          <div style="display: flex; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 16px;">
            <div style="background: #eef2ff; color: #4f46e5; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; margin-right: 12px; font-weight: bold;">
              P1
            </div>
            <div>
              <h2 style="margin: 0; font-size: 17px; font-weight: 700; color: #0f172a;">Plan de Entrenamiento</h2>
              <div style="font-size: 12px; color: #64748b;">Rutina estructurada para máxima eficiencia y recuperación</div>
            </div>
          </div>
          <div style="font-size: 13.5px; line-height: 1.7; color: #334155; white-space: pre-wrap;">${this.coachResult.workoutPlan}</div>
        </div>

        <!-- Sección 2: Guía de Nutrición -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 22px 24px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
          <div style="display: flex; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 16px;">
            <div style="background: #ecfdf5; color: #059669; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; margin-right: 12px; font-weight: bold;">
              N1
            </div>
            <div>
              <h2 style="margin: 0; font-size: 17px; font-weight: 700; color: #0f172a;">Guía de Nutrición y Hábitos</h2>
              <div style="font-size: 12px; color: #64748b;">Distribución de comidas adaptada a tu preferencia</div>
            </div>
          </div>
          <div style="font-size: 13.5px; line-height: 1.7; color: #334155; white-space: pre-wrap;">${this.coachResult.nutritionPlan}</div>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; color: #94a3b8; font-size: 11px;">
          <div>B-Track AI • Tu Coach Inteligente de Fitness</div>
          <div>Emitido el ${todayDate}</div>
        </div>

      </div>
    `;

    // Crear un contenedor temporal invisible para html2pdf
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = pdfHtml;

    const opt: any = {
      margin:       [8, 8, 8, 8],
      filename:     `Plan_BTrack_${this.userName.replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
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

    this.http.post('/api/v1/ai/chat', payload).subscribe({
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
        this.showAiErrorAlert(err, 'Hubo un error de conexión con la IA.');
      }
    });
  }

  async showAiErrorAlert(err: any, fallbackMessage: string = 'Hubo un problema al consultar la IA.') {
    let title = 'Aviso';
    let message = fallbackMessage;

    if (err) {
      if (err.status === 429) {
        title = '⏱️ Límite de IA';
        message = 'Has alcanzado el límite de análisis de IA (máximo 5 por minuto). Por favor, espera unos segundos antes de volver a intentar.';
      } else if (err.status === 503) {
        title = '⚡ Alta Demanda en IA';
        message = 'Google Gemini está recibiendo un pico alto de consultas en este instante. Por favor, reintenta tu escaneo en unos segundos.';
      } else {
        let rawError = '';
        if (typeof err.error === 'string') {
          try {
            const parsed = JSON.parse(err.error);
            rawError = parsed.error || parsed.message || err.error;
          } catch (e) {
            rawError = err.error;
          }
        } else if (err.error && typeof err.error === 'object') {
          rawError = typeof err.error.error === 'string' ? err.error.error : (err.error.message || JSON.stringify(err.error));
        } else if (typeof err.message === 'string') {
          rawError = err.message;
        }

        if (rawError) {
          const lower = rawError.toLowerCase();
          if (lower.includes('503') || lower.includes('high demand') || lower.includes('unavailable')) {
            title = '⚡ Alta Demanda en IA';
            message = 'Google Gemini está recibiendo un pico alto de consultas en este instante. Por favor, reintenta tu escaneo en unos segundos.';
          } else {
            message = rawError;
          }
        }
      }
    }

    const finalMessage = typeof message === 'string' ? message : JSON.stringify(message);

    const alert = await this.alertCtrl.create({
      header: title,
      message: finalMessage,
      buttons: ['ENTENDIDO'],
      cssClass: 'neon-alert'
    });
    await alert.present();
  }
}
