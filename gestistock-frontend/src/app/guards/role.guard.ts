import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (!authService.isLoggedIn()) {
    router.navigateByUrl('/');
    return false;
  }

  if (!authService.hasRole('Admin')) {
    router.navigateByUrl('/app/dashboard');
    return false;
  }

  return true;
};