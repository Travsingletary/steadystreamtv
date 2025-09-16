import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>
            <h2>Welcome Back to SteadyStream TV</h2>
          </mat-card-title>
          <mat-card-subtitle>
            Sign in to access your IPTV subscription
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onLogin()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="your@email.com">
              <mat-icon matSuffix>email</mat-icon>
              <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
                Please enter a valid email
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput
                     [type]="hidePassword ? 'password' : 'text'"
                     formControlName="password">
              <button mat-icon-button matSuffix
                      type="button"
                      (click)="hidePassword = !hidePassword">
                <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                Password is required
              </mat-error>
            </mat-form-field>

            <button mat-raised-button
                    color="primary"
                    type="submit"
                    class="full-width submit-btn"
                    [disabled]="loginForm.invalid || isLoading">
              <mat-icon *ngIf="isLoading">hourglass_empty</mat-icon>
              {{isLoading ? 'Signing In...' : 'Sign In'}}
            </button>
          </form>

          <div class="auth-links">
            <p>Don't have an account?
              <a (click)="goToSignup()" class="link">Sign up here</a>
            </p>
            <a (click)="resetPassword()" class="link">Forgot your password?</a>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: 20px;
    }

    .auth-card {
      width: 100%;
      max-width: 400px;
      padding: 20px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .submit-btn {
      height: 48px;
      margin: 20px 0;
    }

    .auth-links {
      text-align: center;
      margin-top: 20px;
    }

    .link {
      color: #3f51b5;
      cursor: pointer;
      text-decoration: underline;
    }

    .link:hover {
      color: #303f9f;
    }

    mat-card-header {
      text-align: center;
      margin-bottom: 20px;
    }

    h2 {
      margin: 0;
      color: #333;
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private supabase = inject(SupabaseService);
  private snackBar = inject(MatSnackBar);

  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onLogin() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const { email, password } = this.loginForm.value;

      try {
        const { error } = await this.supabase.signIn(email, password);

        if (error) {
          this.snackBar.open(error.message, 'Close', { duration: 5000 });
        } else {
          this.snackBar.open('Welcome back!', 'Close', { duration: 3000 });
          this.router.navigate(['/subscription']);
        }
      } catch {
        this.snackBar.open('Login failed. Please try again.', 'Close', { duration: 5000 });
      } finally {
        this.isLoading = false;
      }
    }
  }

  goToSignup() {
    this.router.navigate(['/signup']);
  }

  async resetPassword() {
    const email = this.loginForm.get('email')?.value;
    if (!email) {
      this.snackBar.open('Please enter your email first', 'Close', { duration: 3000 });
      return;
    }

    try {
      await this.supabase.resetPassword(email);
      this.snackBar.open('Password reset email sent!', 'Close', { duration: 5000 });
    } catch {
      this.snackBar.open('Failed to send reset email', 'Close', { duration: 3000 });
    }
  }
}