import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Injectable } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private auth: Auth,
    private angularFireAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router
  ) {}

  currentUser$: Observable<any> = authState(this.auth);

  getCurrentUserEmail(): Promise<string | null> {
    return new Promise((resolve) => {
      this.currentUser$.subscribe((user) => {
        resolve(user ? user.email : null);
      });
    });
  }

  async isLoggedIn(): Promise<boolean> {
    return new Promise((resolve) => {
      this.currentUser$.subscribe((user) => {
        resolve(!!user);
      });
    });
  }

  async isAdmin(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.currentUser$.subscribe((user) => {
        if (user && user.email) {
          this.afs
            .collection('users', (ref) => ref.where('email', '==', user.email))
            .valueChanges()
            .subscribe((users: any[]) => {
              if (users && users.length > 0 && users[0].role === 'admin') {
                resolve(true);
              } else {
                resolve(false);
              }
            });
        } else {
          resolve(false);
        }
      });
    });
  }

  async login(email: string, password: string): Promise<void> {
    try {
      await this.angularFireAuth.signInWithEmailAndPassword(email, password);
    } catch (error) {
      throw error;
    }
  }

  async register(email: string, password: string): Promise<void> {
    try {
      this.angularFireAuth.createUserWithEmailAndPassword(email, password);
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    try {
      await this.auth.signOut();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}
