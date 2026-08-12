import { Component, OnInit } from '@angular/core'; 
import { Router } from '@angular/router';
import { ToastController, AlertController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false
})
export class ProfilePage implements OnInit {
  
  userProfile: any = {
    name: '',
    gender: 'male',
    age: null,
    weight: null,
    height: null,
    activityLevel: 1.2,
    goal: 'maintain'
  };

  weightHistory: any[] = [];
  newWeightLog: number | null = null;
  chart: any = null;
  newGoalLog: string = '';
  userId: string = '';

  constructor(
    public router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.userId = localStorage.getItem('userId') || '2';
    this.loadProfileFromBackend();
    
    // Cargar historial de peso localmente por ahora (hasta migrarlo si se desea)
    const savedHistory = localStorage.getItem('weightHistory');
    if (savedHistory) {
      this.weightHistory = JSON.parse(savedHistory);
      // Para propósitos de demostración: Si solo hay 1 registro, ya no inyectamos historial falso
      // (Eliminamos la inyección para que solo muestre datos reales)
    } else if (this.userProfile.weight) {
      // Si no hay historial, agregar el peso actual
      this.weightHistory.push({
        date: new Date().toISOString().split('T')[0],
        weight: this.userProfile.weight
      });
    }
  }

  loadProfileFromBackend() {
    this.http.get(`http://localhost:8080/api/v1/users/${this.userId}`).subscribe({
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
          
          this.newWeightLog = this.userProfile.weight;
          localStorage.setItem('btrack_user_profile', JSON.stringify(this.userProfile));
        }
      },
      error: (err) => console.error("Error cargando perfil:", err)
    });
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
          borderColor: '#9d00ff', // Neón purple
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
        color: 'warning'
      });
      toast.present();
      return;
    }

    // Cálculo de TMB (Tasa Metabólica Basal) - Ecuación Mifflin-St Jeor
    let bmr = 0;
    if (this.userProfile.gender === 'male') {
      bmr = (10 * this.userProfile.weight) + (6.25 * this.userProfile.height) - (5 * this.userProfile.age) + 5;
    } else {
      bmr = (10 * this.userProfile.weight) + (6.25 * this.userProfile.height) - (5 * this.userProfile.age) - 161;
    }

    // TDEE (Gasto Energético Diario Total)
    let tdee = bmr * this.userProfile.activityLevel;

    // Ajuste por Objetivo
    let targetCalories = tdee;
    if (this.userProfile.goal === 'lose_fat') {
      targetCalories -= 500; // Déficit calórico
    } else if (this.userProfile.goal === 'build_muscle') {
      targetCalories += 300; // Superávit calórico
    }

    // Cálculos de Macros
    // Proteína: 2.2g por kg de peso
    const targetProtein = Math.round(this.userProfile.weight * 2.2);
    const proteinCalories = targetProtein * 4;

    // Grasas: 25% de las calorías totales
    const targetFats = Math.round((targetCalories * 0.25) / 9);
    const fatsCalories = targetFats * 9;

    // Carbohidratos: El resto de las calorías
    const targetCarbs = Math.round((targetCalories - proteinCalories - fatsCalories) / 4);

    const completeProfile = {
      ...this.userProfile,
      baseCalories: Math.round(tdee),
      dailyCaloriesTarget: Math.round(targetCalories),
      dailyProteinTarget: targetProtein,
      dailyCarbsTarget: targetCarbs,
      dailyFatsTarget: targetFats
    };

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
    
    this.http.put(`http://localhost:8080/api/v1/users/${this.userId}`, updateDto).subscribe({
      next: async (res: any) => {
        if (!silent) {
          const toast = await this.toastCtrl.create({
            message: '¡Perfil guardado en la nube exitosamente!',
            duration: 2000,
            color: 'success'
          });
          toast.present();
          this.router.navigate(['/home']);
        }
      },
      error: async (err) => {
        console.error(err);
        if (!silent) {
          const toast = await this.toastCtrl.create({
            message: 'Error al guardar en el servidor',
            duration: 2000,
            color: 'danger'
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
      message: '¿Estás seguro que deseas salir?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Sí, Salir',
          handler: () => {
            localStorage.clear();
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }
}
