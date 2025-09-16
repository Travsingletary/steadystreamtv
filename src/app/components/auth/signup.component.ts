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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatCheckboxModule
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>
            <h2>Join SteadyStream TV</h2>
          </mat-card-title>
          <mat-card-subtitle>
            Create your account and start streaming
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="signupForm" (ngSubmit)="onSignup()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Full Name</mat-label>
              <input matInput formControlName="fullName" placeholder="John Doe">
              <mat-icon matSuffix>person</mat-icon>
              <mat-error *ngIf="signupForm.get('fullName')?.hasError('required')">
                Full name is required
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="your@email.com">
              <mat-icon matSuffix>email</mat-icon>
              <mat-error *ngIf="signupForm.get('email')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="signupForm.get('email')?.hasError('email')">
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
              <mat-error *ngIf="signupForm.get('password')?.hasError('required')">
                Password is required
              </mat-error>
              <mat-error *ngIf="signupForm.get('password')?.hasError('minlength')">
                Password must be at least 6 characters
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirm Password</mat-label>
              <input matInput
                     [type]="hideConfirmPassword ? 'password' : 'text'"
                     formControlName="confirmPassword">
              <button mat-icon-button matSuffix
                      type="button"
                      (click)="hideConfirmPassword = !hideConfirmPassword">
                <mat-icon>{{hideConfirmPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="signupForm.get('confirmPassword')?.hasError('required')">
                Please confirm your password
              </mat-error>
              <mat-error *ngIf="signupForm.hasError('passwordMismatch')">
                Passwords do not match
              </mat-error>
            </mat-form-field>

            <mat-checkbox formControlName="acceptTerms" class="full-width terms-checkbox">
              I agree to the <a href="/terms" target="_blank">Terms of Service</a>
              and <a href="/privacy" target="_blank">Privacy Policy</a>
            </mat-checkbox>

            <button mat-raised-button
                    color="primary"
                    type="submit"
                    class="full-width submit-btn"
                    [disabled]="signupForm.invalid || isLoading">
              <mat-icon *ngIf="isLoading">hourglass_empty</mat-icon>
              {{isLoading ? 'Creating Account...' : 'Create Account'}}
            </button>
          </form>

          <div class="auth-links">
            <p>Already have an account?
              <a (click)="goToLogin()" class="link">Sign in here</a>
            </p>
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

    .terms-checkbox {
      margin-bottom: 16px;
    }

    .terms-checkbox a {
      color: #3f51b5;
      text-decoration: none;
    }

    .terms-checkbox a:hover {
      text-decoration: underline;
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
export class SignupComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private supabase = inject(SupabaseService);
  private snackBar = inject(MatSnackBar);

  signupForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading = false;

  constructor() {
    this.signupForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  async onSignup() {
    if (this.signupForm.valid) {
      this.isLoading = true;
      const { fullName, email, password } = this.signupForm.value;

      try {
        const { error } = await this.supabase.signUp(email, password, {
          full_name: fullName
        });

        if (error) {
          this.snackBar.open(error.message, 'Close', { duration: 5000 });
        } else {
          this.snackBar.open(
            'Account created! Please check your email to verify your account.',
            'Close',
            { duration: 8000 }
          );
          this.router.navigate(['/login']);
        }
      } catch {
        this.snackBar.open('Signup failed. Please try again.', 'Close', { duration: 5000 });
      } finally {
        this.isLoading = false;
      }
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}