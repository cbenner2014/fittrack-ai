import { Component, OnInit } from '@angular/core'; 
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false
})
export class ProfilePage implements OnInit {
  
  userProfile = {
    name: '',
    gender: 'male',
    age: null,
    weight: null,
    height: null,
    activityLevel: 1.2,
    goal: 'maintain'
  };

  constructor(
    public router: Router,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    const saved = localStorage.getItem('btrack_user_profile');
    if (saved) {
      this.userProfile = JSON.parse(saved);
    }
  }

  async saveProfile() {
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
    
    const toast = await this.toastCtrl.create({
      message: '¡Perfil y Metas guardadas exitosamente!',
      duration: 2000,
      color: 'success'
    });
    toast.present();

    this.router.navigate(['/home']);
  }
}
