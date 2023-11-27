import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  isLoggedIn: boolean = false;
  isAdmin: boolean = false;
  mobileMenuOpen = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.isLoggedIn = !!user;
      this.authService.isAdmin().then((isAdmin) => {
        this.isAdmin = isAdmin;
      });
    });
  }

  logout(): void {
    this.authService.logout().then(() => {
      this.router.navigate(['/home']);
      if (this.mobileMenuOpen) this.toggleMobileMenuOpen();
    });
  }

  toggleMobileMenuOpen() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
}
