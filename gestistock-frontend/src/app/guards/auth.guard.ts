import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('gestistock_token');

  if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
    router.navigateByUrl('/');
    return false;
  }

  return true;
};
