import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('authToken');
  
  if (token) {
    const bearerHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    const authReq = req.clone({
      setHeaders: {
        Authorization: bearerHeader
      }
    });
    return next(authReq);
  }

  return next(req);
};
