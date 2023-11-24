import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Firestore, addDoc, collection } from '@angular/fire/firestore';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NavbarComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'recpiebook';

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    // const testCollection = collection(this.firestore, 'recipes');
    // addDoc(testCollection, {
    //   name: 'Recipe name',
    //   cookTime: 'Cooking time',
    //   ingredients: ['ingredient 1', 'ingredient 2', 'ingredient 3'],
    //   steps: [
    //     { description: 'first step...' },
    //     { description: 'second step...' },
    //     { description: 'third step...' },
    //   ],
    // });
  }
}
