import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from "@angular/core";
import { ENV } from '../../../environments/environment';
import { Observable, catchError, throwError, map, retry } from 'rxjs';


@Injectable()
export class AuthenticationInterceptor implements HttpInterceptor {
  constructor() {}

  public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const authReq = request.clone({
      url: !request.url.includes('/documents')  ? `${ENV.BaseAPI}${request.url}` : request.url,
    });
    return next.handle(authReq).pipe(
      retry(2),
      map(res => {
          return res
      }),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => new Error(error.message));
      })
    )
  }
} 