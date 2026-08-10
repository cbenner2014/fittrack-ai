import { Component } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { HttpClient } from '@angular/common/http';
import { LoadingController, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  
  userProfile = {
    name: 'Juan',
    goal: 'Perder Grasa',
    calories: 1450,
    caloriesGoal: 2000,
    protein: 110,
    carbs: 120,
    fats: 45
  };

  constructor(
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {}

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
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt // Permite elegir entre cámara o galería
      });

      if (!image.base64String) return;

      const loading = await this.loadingCtrl.create({
        message: 'La IA está analizando tu comida...',
        spinner: 'crescent'
      });
      await loading.present();

      // Convertir a archivo y enviar al backend
      const blob = this.b64toBlob(image.base64String, 'image/jpeg');
      const formData = new FormData();
      formData.append('file', blob, 'comida.jpg');

      this.http.post('http://localhost:8080/api/v1/meals/analyze', formData).subscribe({
        next: async (res: any) => {
          await loading.dismiss();
          const alert = await this.alertCtrl.create({
            header: 'Análisis Completo',
            message: `Plato: ${res.foodItems}\nCalorías: ${res.totalCalories} kcal\nProteína: ${res.totalProtein}g`,
            buttons: ['Genial']
          });
          await alert.present();
        },
        error: async (err) => {
          await loading.dismiss();
          alert('Hubo un error al conectar con la IA.');
        }
      });
    } catch (e) {
      console.log('Cámara cancelada o error:', e);
    }
  }

  async scanMachine() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt
      });

      if (!image.base64String) return;

      const loading = await this.loadingCtrl.create({
        message: 'Identificando máquina de gimnasio...',
        spinner: 'crescent'
      });
      await loading.present();

      const blob = this.b64toBlob(image.base64String, 'image/jpeg');
      const formData = new FormData();
      formData.append('file', blob, 'maquina.jpg');

      this.http.post('http://localhost:8080/api/v1/machines/analyze', formData).subscribe({
        next: async (res: any) => {
          await loading.dismiss();
          const alert = await this.alertCtrl.create({
            header: 'Máquina Identificada',
            message: `${res.name}\n\nMusculos: ${res.targetMuscles}\nInstrucciones: ${res.usageInstructions}`,
            buttons: ['Entendido']
          });
          await alert.present();
        },
        error: async (err) => {
          await loading.dismiss();
          alert('Hubo un error al conectar con la IA.');
        }
      });
    } catch (e) {
      console.log('Cámara cancelada o error:', e);
    }
  }

  async askCoach() {
    const loading = await this.loadingCtrl.create({
      message: 'Generando plan maestro...',
      spinner: 'crescent'
    });
    await loading.present();

    // Asumimos que el usuario logueado es el ID 1 por ahora
    this.http.post('http://localhost:8080/api/v1/coach-recommendations/generate-plan/1', {}).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        const alert = await this.alertCtrl.create({
          header: 'Tu Coach Dice:',
          message: res.message + '\n\n' + res.workoutPlan,
          buttons: ['¡A darle!']
        });
        await alert.present();
      },
      error: async (err) => {
        await loading.dismiss();
        alert('Hubo un error al conectar con la IA.');
      }
    });
  }
}
