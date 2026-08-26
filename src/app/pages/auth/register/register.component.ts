import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

function passwordsMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
  };
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['../_auth-shell.scss', './register.component.scss']
})
export class RegisterComponent {
  readonly form = this.fb.group(
    {
      fullName: ['', [Validators.required]],
      workspaceName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: passwordsMatchValidator() }
  );

  submitting = false;
  errorMessage: string | null = null;

  constructor(private readonly fb: FormBuilder, private readonly authService: AuthService, private readonly router: Router) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = null;

    const { fullName, workspaceName, email, password } = this.form.getRawValue();

    this.authService.register({ fullName: fullName!, workspaceName: workspaceName!, email: email!, password: password! }).subscribe({
      next: () => this.router.navigateByUrl('/overview'),
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        this.errorMessage =
          error.status === 409 ? 'An account with this email already exists.' : 'Something went wrong. Please try again.';
      }
    });
  }
}
