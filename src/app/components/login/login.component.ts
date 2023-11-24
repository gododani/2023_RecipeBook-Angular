import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  get email() {
    return this.loginForm.get('email')!.value;
  }

  get password() {
    return this.loginForm.get('password')!.value;
  }

  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {}

  login() {
    if (!this.loginForm.valid) {
      return;
    }
    const { email, password } = this.loginForm.value;
    this.authService
      .login(email as string, password as string)
      .then(() => this.router.navigate(['/home']))
      .catch(() => {
        this.errorMessage = 'Invalid email or password';
      });
  }

  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);
    if (control?.hasError('required')) {
      return 'This field is required';
    } else if (control?.hasError('email')) {
      return 'Invalid email address';
    } else if (control?.hasError('minlength')) {
      return 'The password must be at least 6 characters long';
    }
    return '';
  }
}
