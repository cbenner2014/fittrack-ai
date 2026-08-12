import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.userId = localStorage.getItem('userId') || '2';
    this.generateWeek();
    this.loadHistory();
  }
  
  ionViewWillEnter() {
    this.userId = localStorage.getItem('userId') || '2';
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
    this.http.get<any[]>(`http://192.168.10.198:8080/api/v1/meals/user/${this.userId}`).subscribe({
      next: (data) => {
        this.allMeals = data;
        this.updateCalendarDots();
        this.filterDataByDate();
      },
      error: (e) => console.error('Error cargando comidas', e)
    });

    this.http.get<any[]>(`http://192.168.10.198:8080/api/v1/machine-logs/user/${this.userId}`).subscribe({
      next: (data) => {
        this.allMachines = data;
        this.updateCalendarDots();
        this.filterDataByDate();
      },
      error: (e) => console.error('Error cargando máquinas', e)
    });
  }

  updateCalendarDots() {
    this.weekDays.forEach(day => {
      const hasMeal = this.allMeals.some(m => m.logDate && m.logDate.startsWith(day.fullDateString));
      const hasMachine = this.allMachines.some(m => m.logDate && m.logDate.startsWith(day.fullDateString));
      day.hasData = hasMeal || hasMachine;
    });
  }

  filterDataByDate() {
    const dateStr = this.selectedDate.toISOString().split('T')[0];
    this.todaysMeals = this.allMeals.filter(m => m.logDate && m.logDate.startsWith(dateStr));
    this.machineHistory = this.allMachines.filter(m => m.logDate && m.logDate.startsWith(dateStr));
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
    const firstPart = foods.split(',')[0];
    return firstPart.charAt(0).toUpperCase() + firstPart.slice(1).toLowerCase();
  }
}
