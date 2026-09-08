import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Do not attach OBLMS auth token to external 3rd-party endpoints (e.g. Google APIs)
  if (req.url.includes('googleapis.com') || req.url.includes('gstatic.com') || (req.url.startsWith('http') && !req.url.includes('localhost') && !req.url.includes('/api/'))) {
    return next(req);
  }

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
