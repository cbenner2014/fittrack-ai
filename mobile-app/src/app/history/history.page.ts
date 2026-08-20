import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: false,
})
export class HistoryPage implements OnInit {
  currentTab: string = 'diet';
  userId: string = '';
  
  weekDays: any[] = [];
  selectedDate: Date = new Date();
  
  allMeals: any[] = [];
  todaysMeals: any[] = [];
  
  allMachines: any[] = [];
  machineHistory: any[] = [];

  // MODAL DE DETALLES DE MÁQUINA
  isMachineModalOpen: boolean = false;
  selectedMachine: any = null;

  // MODAL DE DETALLES DE COMIDA
  isFoodModalOpen: boolean = false;
  selectedFood: any = null;

  // MODAL DE BIBLIOTECA DE MÁQUINAS
  isLibraryModalOpen: boolean = false;
  uniqueMachineLibrary: any[] = [];
  availableWeekDays: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  constructor(
    private http: HttpClient,
    private toastCtrl: ToastController,
    private router: Router
  ) { }

  ngOnInit() {
    this.userId = localStorage.getItem('userId') || '2';
    this.generateWeek();
    this.loadHistory();
  }
  
  ionViewWillEnter() {
    this.userId = localStorage.getItem('userId') || '';
    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadHistory();
  }

  generateWeek() {
    this.weekDays = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' }).substring(0, 1).toUpperCase();
      this.weekDays.push({
        date: d,
        dayName: dayName,
        dayNumber: d.getDate(),
        fullDateString: d.toISOString().split('T')[0],
        hasData: false
      });
    }
  }

  selectDate(day: any) {
    this.selectedDate = new Date(day.date);
    this.filterDataByDate();
  }

  loadHistory() {
    this.http.get<any[]>(`/api/v1/meals/user/${this.userId}`).subscribe({
      next: (data) => {
        this.allMeals = data;
        this.updateCalendarDots();
        this.filterDataByDate();
      },
      error: (e) => console.error('Error cargando comidas', e)
    });

    this.http.get<any[]>(`/api/v1/machine-logs/user/${this.userId}`).subscribe({
      next: (data) => {
        this.allMachines = (data || []).map((m: any) => ({
          ...m,
          name: m.machineName || m.name || 'Máquina de Ejercicio',
          machineName: m.machineName || m.name || 'Máquina de Ejercicio',
          targetMuscles: m.targetMuscle || m.targetMuscles || 'Cuerpo Completo',
          targetMuscle: m.targetMuscle || m.targetMuscles || 'Cuerpo Completo',
          instructions: m.instructions || m.usageInstructions || '',
          usageInstructions: m.instructions || m.usageInstructions || '',
          tips: m.tips || '',
          routineDays: m.routineDays || '',
          weightLog: m.weightLog || ''
        }));

        // Construir catálogo de máquinas únicas guardadas
        const seen = new Set();
        this.uniqueMachineLibrary = [];
        this.allMachines.forEach(m => {
          const key = m.name.toLowerCase().trim();
          if (!seen.has(key)) {
            seen.add(key);
            this.uniqueMachineLibrary.push(m);
          }
        });

        this.updateCalendarDots();
        this.filterDataByDate();
      },
      error: (e) => console.error('Error cargando máquinas', e)
    });
  }

  updateCalendarDots() {
    const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    this.weekDays.forEach(day => {
      const hasMeal = this.allMeals.some(m => m.logDate && m.logDate.startsWith(day.fullDateString));
      const hasDirectMachine = this.allMachines.some(m => m.logDate && m.logDate.startsWith(day.fullDateString));
      
      const dayOfWeekName = dayNames[day.date.getDay()];
      const hasRoutineMachine = this.allMachines.some(m => {
        if (!m.routineDays) return false;
        return m.routineDays.toLowerCase().includes(dayOfWeekName);
      });

      day.hasData = hasMeal || hasDirectMachine || hasRoutineMachine;
    });
  }

  filterDataByDate() {
    const dateStr = this.selectedDate.toISOString().split('T')[0];
    const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const currentDayName = dayNames[this.selectedDate.getDay()];

    this.todaysMeals = this.allMeals.filter(m => m.logDate && m.logDate.startsWith(dateStr));
    
    // 1. Máquinas con log en esta fecha específica
    const loggedThisDay = this.allMachines.filter(m => m.logDate && m.logDate.startsWith(dateStr));
    
    // 2. Máquinas asignadas a este día de la semana en la rutina
    const scheduledThisDay = this.allMachines.filter(m => {
      if (!m.routineDays) return false;
      return m.routineDays.toLowerCase().includes(currentDayName);
    });

    // Combinar sin duplicados por ID o nombre
    const combined = [...loggedThisDay];
    scheduledThisDay.forEach(sched => {
      if (!combined.some(c => c.id === sched.id || c.name.toLowerCase() === sched.name.toLowerCase())) {
        combined.push(sched);
      }
    });

    this.machineHistory = combined;
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
    return { cals: Math.round(cals), p: Math.round(p), c: Math.round(c), f: Math.round(f) };
  }

  formatFoodName(foods: string): string {
    if (!foods) return 'Comida Desconocida';
    try {
      const parsed = JSON.parse(foods);
      if (Array.isArray(parsed)) return parsed.join(', ');
      return parsed.toString();
    } catch (e) {
      const firstPart = foods.split(',')[0];
      return firstPart.charAt(0).toUpperCase() + firstPart.slice(1).toLowerCase();
    }
  }

  getMealTypeName(type: string): string {
    const map: any = { 'BREAKFAST': 'Desayuno', 'LUNCH': 'Almuerzo', 'DINNER': 'Cena', 'SNACK': 'Snack' };
    return map[type] || 'Comida';
  }

  openFoodDetails(meal: any) {
    this.selectedFood = meal;
    this.isFoodModalOpen = true;
  }

  async deleteFood(mealId: number) {
    if (!mealId) return;
    this.http.delete(`/api/v1/meals/${mealId}`).subscribe({
      next: async () => {
        this.isFoodModalOpen = false;
        this.loadHistory();
        const toast = await this.toastCtrl.create({
          message: 'Comida eliminada del historial',
          duration: 2000,
          color: 'danger',
          icon: 'trash-outline'
        });
        toast.present();
      },
      error: (err) => console.error('Error eliminando comida:', err)
    });
  }

  openMachineDetails(machine: any) {
    this.selectedMachine = machine;
    this.isMachineModalOpen = true;
  }

  toggleMachineRoutineDay(day: string) {
    if (!this.selectedMachine) return;
    let days: string[] = this.selectedMachine.routineDays ? this.selectedMachine.routineDays.split(',').map((d: string) => d.trim()).filter((d: string) => d) : [];
    const idx = days.indexOf(day);
    if (idx > -1) {
      days.splice(idx, 1);
    } else {
      days.push(day);
    }
    this.selectedMachine.routineDays = days.join(',');
  }

  isMachineRoutineDayActive(day: string): boolean {
    if (!this.selectedMachine || !this.selectedMachine.routineDays) return false;
    return this.selectedMachine.routineDays.includes(day);
  }

  async saveRoutineDays(machine: any) {
    if (!machine || !machine.id) return;
    this.http.put(`/api/v1/machine-logs/${machine.id}/routine-days`, { routineDays: machine.routineDays || '' }).subscribe({
      next: async () => {
        this.loadHistory();
        const toast = await this.toastCtrl.create({
          message: '🗓️ Días de rutina actualizados',
          duration: 2000,
          color: 'success',
          icon: 'calendar-outline'
        });
        toast.present();
      },
      error: (err) => console.error('Error guardando días de rutina:', err)
    });
  }

  getMachineProgressHistory(machine: any): any[] {
    if (!machine) return [];
    const name = (machine.name || machine.machineName || '').toLowerCase().trim();
    return this.allMachines
      .filter(m => (m.name || m.machineName || '').toLowerCase().trim() === name && m.weightLog && m.weightLog.trim().length > 0)
      .sort((a, b) => new Date(b.logDate || b.createdAt).getTime() - new Date(a.logDate || a.createdAt).getTime());
  }

  formatSessionDate(dateStr: string): string {
    if (!dateStr) return 'Reciente';
    const dateObj = new Date(dateStr + 'T12:00:00Z');
    return dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  async saveMachineWeight(machine: any) {
    if (!machine) return;
    const targetDate = this.selectedDate.toISOString().split('T')[0];

    // Buscar si ya existe un registro de esta máquina guardado exactamente en la fecha seleccionada
    const name = (machine.name || machine.machineName || '').toLowerCase().trim();
    const existingToday = this.allMachines.find(m => 
      (m.name || m.machineName || '').toLowerCase().trim() === name && 
      m.logDate && m.logDate.startsWith(targetDate)
    );

    if (existingToday && existingToday.id) {
      // Actualizar el registro existente de hoy
      this.http.put(`/api/v1/machine-logs/${existingToday.id}/weight`, { weightLog: machine.weightLog || '' }).subscribe({
        next: async () => {
          existingToday.weightLog = machine.weightLog;
          this.loadHistory();
          const toast = await this.toastCtrl.create({
            message: '¡Carga actualizada en la nube! 💪',
            duration: 2000,
            color: 'success',
            icon: 'barbell-outline'
          });
          toast.present();
        },
        error: async (err) => console.error('Error actualizando peso:', err)
      });
    } else {
      // Crear un nuevo registro para la fecha seleccionada (para no sobrescribir sesiones anteriores)
      const request = {
        userId: this.userId,
        machineName: machine.name || machine.machineName,
        targetMuscle: machine.targetMuscles || machine.targetMuscle,
        instructions: machine.instructions || machine.usageInstructions,
        tips: machine.tips || '',
        imageUrl: machine.imageUrl,
        weightLog: machine.weightLog || '',
        routineDays: machine.routineDays || '',
        logDate: targetDate
      };

      this.http.post('/api/v1/machine-logs', request).subscribe({
        next: async (res: any) => {
          this.loadHistory();
          const toast = await this.toastCtrl.create({
            message: '¡Nuevo registro de carga guardado en tu historial! 🚀',
            duration: 2000,
            color: 'success',
            icon: 'trending-up-outline'
          });
          toast.present();
        },
        error: async (err) => console.error('Error creando registro:', err)
      });
    }
  }

  async addFromLibraryToToday(libMachine: any) {
    const targetDate = this.selectedDate.toISOString().split('T')[0];
    const request = {
      userId: this.userId,
      machineName: libMachine.name,
      targetMuscle: libMachine.targetMuscles,
      instructions: libMachine.instructions,
      tips: libMachine.tips || '',
      imageUrl: libMachine.imageUrl,
      weightLog: '',
      routineDays: libMachine.routineDays || '',
      logDate: targetDate
    };

    this.http.post('/api/v1/machine-logs', request).subscribe({
      next: async () => {
        this.isLibraryModalOpen = false;
        this.loadHistory();
        const toast = await this.toastCtrl.create({
          message: `¡${libMachine.name} agregada al entrenamiento de hoy! 🏋️‍♂️`,
          duration: 2000,
          color: 'success',
          icon: 'checkmark-circle-outline'
        });
        toast.present();
      },
      error: (err) => console.error('Error agregando máquina:', err)
    });
  }

  async deleteMachine(machineId: number) {
    if (!machineId) return;
    this.http.delete(`/api/v1/machine-logs/${machineId}`).subscribe({
      next: async () => {
        this.isMachineModalOpen = false;
        this.loadHistory();
        const toast = await this.toastCtrl.create({
          message: 'Máquina eliminada del historial',
          duration: 2000,
          color: 'danger',
          icon: 'trash-outline'
        });
        toast.present();
      },
      error: (err) => console.error('Error eliminando máquina:', err)
    });
  }
}
