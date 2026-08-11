import { Component, OnInit } from '@angular/core'; 
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
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

  constructor(
    public router: Router,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    const saved = localStorage.getItem('btrack_user_profile');
    if (saved) {
      this.userProfile = JSON.parse(saved);
      this.newWeightLog = this.userProfile.weight;
    }
    
    const savedHistory = localStorage.getItem('weightHistory');
    if (savedHistory) {
      this.weightHistory = JSON.parse(savedHistory);
      // Para propósitos de demostración: Si solo hay 1 registro, inyectamos historial falso hacia atrás
      if (this.weightHistory.length === 1) {
        this.injectDummyData(this.weightHistory[0].weight);
      }
    } else if (this.userProfile.weight) {
      // Si no hay historial, agregar el peso actual e inyectar historial falso
      this.weightHistory.push({
        date: new Date().toISOString().split('T')[0],
        weight: this.userProfile.weight
      });
      this.injectDummyData(this.userProfile.weight);
    }
  }

  // Método temporal para simular que el usuario ha usado la app por 5 días
  injectDummyData(currentWeight: number) {
    const today = new Date();
    this.weightHistory = [];
    
    // Generar 5 días hacia atrás con pesos más altos (simulando pérdida de peso)
    for (let i = 5; i > 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      this.weightHistory.push({
        date: d.toISOString().split('T')[0],
        weight: currentWeight + (i * 0.8) // Cada día pesaba 800g más
      });
    }
    
    // Agregar el día de hoy
    this.weightHistory.push({
      date: today.toISOString().split('T')[0],
      weight: currentWeight
    });
    
    localStorage.setItem('weightHistory', JSON.stringify(this.weightHistory));
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
    
    if (!silent) {
      const toast = await this.toastCtrl.create({
        message: '¡Perfil y Metas guardadas exitosamente!',
        duration: 2000,
        color: 'success'
      });
      toast.present();
      this.router.navigate(['/home']);
    }
  }
}
