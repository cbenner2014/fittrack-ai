import { Injectable, Injector } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptor implements HttpInterceptor {

  constructor(private injector: Injector) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    
    // Obtener el token del localStorage
    const token = localStorage.getItem('token');

    // Control de Seguridad Anti-Fuga: Solo inyectar el Bearer Token a rutas internas de nuestra API (/api/...)
    // Nunca enviar el token a servidores externos de terceros (mapas, CDNs, etc.)
    const isApiUrl = request.url.startsWith('/api') || request.url.startsWith('http://localhost') || request.url.includes('app.dabecode.com/api');

    if (token && isApiUrl) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Si el token expiró o fue revocado, limpiar sesión por completo
          localStorage.clear();
          const router = this.injector.get(Router);
          router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }
}
