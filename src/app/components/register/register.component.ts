import { AngularFirestore } from '@angular/fire/compat/firestore';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { delay } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  //Username validator
  usernameLengthValidator: ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const minLength = 3;
    return control.value && control.value.length >= minLength
      ? null
      : { usernameLength: true };
  };

  // Passwords match validator
  confirmPasswordValidator: ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const password = control.parent?.get('password')?.value;
    const passwordConfirm = control.parent?.get('passwordConfirm')?.value;

    return password === passwordConfirm ? null : { passwordNoMatch: true };
  };

  // Register Form
  registerForm = new FormGroup({
    username: new FormControl('', [
      Validators.required,
      this.usernameLengthValidator,
    ]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
    passwordConfirm: new FormControl('', [
      Validators.required,
      this.confirmPasswordValidator,
    ]),
  });

  get username() {
    return this.registerForm.get('username')!.value;
  }

  get email() {
    return this.registerForm.get('email')!.value;
  }

  get password() {
    return this.registerForm.get('password')!.value;
  }

  get passwordConfirm() {
    return this.registerForm.get('passwordConfirm')!.value;
  }

  errorMessage: string = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private afs: AngularFirestore
  ) {}

  register() {
    if (!this.registerForm.valid) {
      return;
    }
    const { username, email, password } = this.registerForm.value;

    this.authService
      .register(email as string, password as string)
      .then(() => {
        let data = {
          username: username,
          email: email,
          role: 'user',
          likes: [],
          dislikes: [],
          favourites: [],
        };

        this.afs
          .collection('users')
          .add(data)
          .then(async() => {
            await new Promise(f => setTimeout(f, 1100));
            this.router.navigate(['/home']);
          })
          .catch((error) => {
            this.errorMessage = error;
          });
      })
      .catch((error) => {
        this.errorMessage = error;
      });
  }

  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
    if (control?.hasError('required')) {
      return 'This field is required';
    } else if (control?.hasError('usernameLength')) {
      return 'Username must be at least 3 characters long';
    } else if (control?.hasError('email')) {
      return 'Invalid email address';
    } else if (control?.hasError('passwordNoMatch')) {
      return 'Passwords must match';
    } else if (control?.hasError('minlength')) {
      return 'The password must be at least 6 characters long';
    }
    return '';
  }
}
