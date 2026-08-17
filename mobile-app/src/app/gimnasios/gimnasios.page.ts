import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-gimnasios',
  templateUrl: './gimnasios.page.html',
  styleUrls: ['./gimnasios.page.scss'],
  standalone: false
})
export class GimnasiosPage implements OnInit {

  mapUrl: SafeResourceUrl | null = null;
  loadingLocation: boolean = true;

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit() {
    this.getUserLocation();
  }

  getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          // Actualizamos la URL con las coordenadas reales del usuario
          const url = `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
          this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
          this.loadingLocation = false;
        },
        (error) => {
          console.error('Error obteniendo ubicaciÃ³n', error);
          // Fallback a un punto cÃ©ntrico de Lima si rechazan el permiso
          const fallback = `https://www.google.com/maps?q=-12.0464,-77.0428&z=13&output=embed`;
          this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fallback);
          this.loadingLocation = false;
        }
      );
    } else {
      const fallback = `https://www.google.com/maps?q=-12.0464,-77.0428&z=13&output=embed`;
      this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fallback);
      this.loadingLocation = false;
    }
  }

}
