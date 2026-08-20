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

  // VARIABLES PARA SELECTORES NUMÉRICOS PREDETERMINADOS
  inputSets: number = 4;
  inputReps: number = 12;
  inputWeight: number = 50;
  weightUnit: string = 'kg'; // 'kg' o 'lbs'

  // SECCIONES COLAPSABLES (ACORDEONES) DEL MODAL DE MÁQUINA
  showWeightInput: boolean = false;
  showHistorySection: boolean = false;
  showRoutineSchedule: boolean = false;
  showTechnique: boolean = false;
  showProTips: boolean = false;

  // 1. CRONÓMETRO DE DESCANSO FLOTANTE ENTRE SERIES
  restTimerActive: boolean = false;
  restTimeRemaining: number = 90; // segundos
  restTotalTime: number = 90;
  restTimerInterval: any = null;
  isRestTimerVisible: boolean = false;

  // 5. MODAL DE COMPARTIR ENTRENAMIENTO / LOGRO
  isShareModalOpen: boolean = false;

  openMachineDetails(machine: any) {
    this.selectedMachine = machine;
    this.showWeightInput = false;
    this.showHistorySection = false;
    this.showRoutineSchedule = false;
    this.showTechnique = false;
    this.showProTips = false;
    this.isMachineModalOpen = true;

    // Autocargar valores de la última serie si existen para mayor comodidad
    const history = this.parseWeightHistory(machine);
    if (history.length > 0) {
      const last = history[0].weight || '';
      
      const weightMatch = last.match(/(\d+(?:\.\d+)?)\s*(kg|lbs)/i);
      if (weightMatch) {
        this.inputWeight = parseFloat(weightMatch[1]);
        this.weightUnit = weightMatch[2].toLowerCase();
      }

      const setsMatch = last.match(/(\d+)\s*series/i);
      if (setsMatch) this.inputSets = parseInt(setsMatch[1]);

      const repsMatch = last.match(/(\d+)\s*reps/i);
      if (repsMatch) this.inputReps = parseInt(repsMatch[1]);
    } else {
      this.inputSets = 4;
      this.inputReps = 12;
      this.inputWeight = 50;
      this.weightUnit = 'kg';
    }
  }

  // MÉTODOS DEL CRONÓMETRO DE DESCANSO
  startRestTimer(seconds: number = 90) {
    this.clearRestTimer();
    this.restTotalTime = seconds;
    this.restTimeRemaining = seconds;
    this.restTimerActive = true;
    this.isRestTimerVisible = true;

    this.restTimerInterval = setInterval(() => {
      if (this.restTimeRemaining > 0) {
        this.restTimeRemaining--;
      } else {
        this.onRestTimerComplete();
      }
    }, 1000);
  }

  addRestTime(extraSeconds: number = 30) {
    this.restTimeRemaining += extraSeconds;
    this.restTotalTime += extraSeconds;
  }

  stopRestTimer() {
    this.clearRestTimer();
    this.isRestTimerVisible = false;
  }

  clearRestTimer() {
    if (this.restTimerInterval) {
      clearInterval(this.restTimerInterval);
      this.restTimerInterval = null;
    }
    this.restTimerActive = false;
  }

  async onRestTimerComplete() {
    this.clearRestTimer();
    this.isRestTimerVisible = false;
    if ('vibrate' in navigator) {
      try { navigator.vibrate([200, 100, 200]); } catch (e) {}
    }
    const toast = await this.toastCtrl.create({
      message: '🔔 ¡Descanso completado! A por la siguiente serie 💪',
      duration: 3000,
      position: 'middle',
      icon: 'timer-outline'
    });
    toast.present();
  }

  formatTimer(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // 2. DETECCIÓN DE RÉCORD PERSONAL (PR)
  getMaxWeight(machine: any): number {
    const history = this.parseWeightHistory(machine);
    let max = 0;
    for (const item of history) {
      const match = (item.weight || '').match(/(\d+(?:\.\d+)?)\s*(kg|lbs)/i);
      if (match) {
        const val = parseFloat(match[1]);
        if (val > max) max = val;
      }
    }
    return max;
  }

  isPersonalRecord(record: any, machine: any): boolean {
    const max = this.getMaxWeight(machine);
    if (max <= 0) return false;
    const match = (record.weight || '').match(/(\d+(?:\.\d+)?)\s*(kg|lbs)/i);
    if (!match) return false;
    return parseFloat(match[1]) === max;
  }

  // 3. RECOMENDACIÓN INTELIGENTE DE SOBRECARGA IA
  getAiProgressionSuggestion(machine: any): string {
    const history = this.parseWeightHistory(machine);
    if (history.length === 0) {
      return '🎯 Calibra hoy 3-4 series con peso moderado y técnica estricta.';
    }
    const last = history[0];
    const weightMatch = (last.weight || '').match(/(\d+(?:\.\d+)?)\s*(kg|lbs)/i);
    const repsMatch = (last.weight || '').match(/(\d+)\s*reps/i);
    const setsMatch = (last.weight || '').match(/(\d+)\s*series/i);

    const lastWeight = weightMatch ? parseFloat(weightMatch[1]) : 0;
    const unit = weightMatch ? weightMatch[2].toLowerCase() : 'kg';
    const lastReps = repsMatch ? parseInt(repsMatch[1]) : 12;
    const lastSets = setsMatch ? parseInt(setsMatch[1]) : 4;

    if (lastWeight > 0) {
      const targetWeight = lastWeight + (unit === 'kg' ? 2.5 : 5);
      return `💡 Última sesión: ${lastWeight}${unit} (${lastSets}x${lastReps}). Hoy busca ${targetWeight}${unit} para ${Math.max(6, lastReps - 2)} reps o mantén ${lastWeight}${unit} para +2 reps.`;
    }
    return `💡 Meta de hoy: Busca aumentar 1 o 2 repeticiones respecto a tu última sesión.`;
  }

  incrementSets() { this.inputSets++; }
  decrementSets() { if (this.inputSets > 1) this.inputSets--; }

  incrementReps() { this.inputReps += 2; }
  decrementReps() { if (this.inputReps > 2) this.inputReps -= 2; }

  incrementWeight(step: number = 5) { this.inputWeight = (this.inputWeight || 0) + step; }
  decrementWeight(step: number = 5) { if (this.inputWeight >= step) this.inputWeight -= step; }

  toggleWeightUnit() {
    if (this.weightUnit === 'kg') {
      this.weightUnit = 'lbs';
      // Conversión aproximada para facilitar al usuario (1kg ~ 2.2lbs)
      this.inputWeight = Math.round(this.inputWeight * 2.2);
    } else {
      this.weightUnit = 'kg';
      this.inputWeight = Math.round(this.inputWeight / 2.2);
    }
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
          position: 'middle',
          icon: 'calendar-outline'
        });
        toast.present();
      },
      error: (err) => console.error('Error guardando días de rutina:', err)
    });
  }

  parseWeightHistory(machine: any): any[] {
    if (!machine || !machine.weightLog) return [];
    let raw = machine.weightLog.trim();
    if (!raw) return [];

    if (raw.startsWith('[') && raw.endsWith(']')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Error parseando weightLog JSON:', e);
      }
    }

    // Compatibilidad con registros simples de texto anteriores
    const logDateObj = machine.logDate ? new Date(machine.logDate + 'T12:00:00Z') : new Date();
    const display = logDateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    return [{
      date: machine.logDate || new Date().toISOString(),
      displayDate: display,
      weight: raw,
      timestamp: logDateObj.getTime()
    }];
  }

  getLatestWeight(machine: any): string {
    const history = this.parseWeightHistory(machine);
    if (!history || history.length === 0) return '';
    return history[0].weight;
  }

  async saveMachineWeight(machine: any) {
    if (!machine) return;

    const previousMax = this.getMaxWeight(machine);
    const currentWeight = this.inputWeight || 0;
    const isNewPR = previousMax > 0 && currentWeight > previousMax;

    const formattedWeightString = `${this.inputSets} series x ${this.inputReps} reps / ${currentWeight} ${this.weightUnit}`;

    const history = this.parseWeightHistory(machine);
    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + 
                          now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    const newEntry = {
      date: now.toISOString(),
      displayDate: formattedDate,
      weight: formattedWeightString,
      timestamp: now.getTime()
    };

    // Agregar al inicio del historial de sobrecarga progresiva
    history.unshift(newEntry);
    const jsonString = JSON.stringify(history);

    machine.weightLog = jsonString;

    this.http.put(`/api/v1/machine-logs/${machine.id}/weight`, { weightLog: jsonString }).subscribe({
      next: async () => {
        this.loadHistory();
        this.showHistorySection = true; // Desplegar automáticamente para ver el avance

        // Iniciar cronómetro de descanso automático de 90 segundos
        this.startRestTimer(90);

        if (isNewPR) {
          const toast = await this.toastCtrl.create({
            message: `🏆 ¡NUEVO RÉCORD PERSONAL! Superaste tu marca con ${currentWeight}${this.weightUnit} 🚀`,
            duration: 3500,
            position: 'middle',
            icon: 'trophy-outline'
          });
          toast.present();
        } else {
          const toast = await this.toastCtrl.create({
            message: `¡${formattedWeightString} guardado! Iniciando 90s de descanso ⏱️`,
            duration: 2200,
            position: 'middle',
            icon: 'trending-up-outline'
          });
          toast.present();
        }
      },
      error: async (err) => {
        console.error('Error guardando peso:', err);
      }
    });
  }

  openShareModal() {
    this.isShareModalOpen = true;
  }

  async deleteWeightRecord(machine: any, index: number) {
    const history = this.parseWeightHistory(machine);
    history.splice(index, 1);
    const jsonString = history.length > 0 ? JSON.stringify(history) : '';
    machine.weightLog = jsonString;

    this.http.put(`/api/v1/machine-logs/${machine.id}/weight`, { weightLog: jsonString }).subscribe({
      next: () => {
        this.loadHistory();
      },
      error: (err) => console.error('Error eliminando registro de serie:', err)
    });
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
          position: 'middle',
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
          position: 'middle',
          color: 'danger',
          icon: 'trash-outline'
        });
        toast.present();
      },
      error: (err) => console.error('Error eliminando máquina:', err)
    });
  }
}
