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

  private readonly baseUrl = 'https://app.dabecode.com';

  constructor(private injector: Injector) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('token');

    let url = request.url;
    // Si la ruta es relativa y empieza con /api, le anteponemos el servidor de producción
    if (url.startsWith('/api')) {
      url = `${this.baseUrl}${url}`;
    } else if (url.startsWith('http://localhost:8080/api')) {
      url = url.replace('http://localhost:8080', this.baseUrl);
    }

    const isApiUrl = url.includes('/api/') || url.includes('app.dabecode.com');

    // Clonar request con la URL absoluta y el token de autenticación
    const headersConfig: { [key: string]: string } = {};
    if (token && isApiUrl) {
      headersConfig['Authorization'] = `Bearer ${token}`;
    }

    request = request.clone({
      url,
      setHeaders: headersConfig
    });

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
