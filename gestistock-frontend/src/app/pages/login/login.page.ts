import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
})
export class LoginPage {
  form: FormGroup;
  loading = signal(false);
  error = signal('');

  showPassword = false;

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  async onSubmit(): Promise<void> {
    this.error.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    try {
      const payload = this.form.getRawValue();
      const response = await firstValueFrom(
        this.http.post<{ ok: boolean; token?: string; user?: unknown; message?: string }>(
          `${environment.apiUrl}/auth/login`,
          payload
        )
      );

      if (!response.ok) {
        this.error.set(response.message || 'Identifiants incorrects.');
        return;
      }

      if (!response.token) {
        this.error.set('Connexion refusee: token manquant.');
        return;
      }

      localStorage.setItem('gestistock_token', response.token);

      await this.router.navigateByUrl('/dashboard');
    } catch (err) {
      if (err instanceof HttpErrorResponse) {
        const apiMessage = err.error?.message;
        if (err.status === 0) {
          this.error.set('Impossible de joindre le serveur.');
        } else {
          this.error.set(apiMessage || 'Identifiants incorrects.');
        }
      } else {
        this.error.set('Une erreur est survenue.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
