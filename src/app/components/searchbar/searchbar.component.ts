import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Recipe } from '../../types/Recipe';

@Component({
  selector: 'app-searchbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './searchbar.component.html',
  styleUrls: ['./searchbar.component.css'],
})
export class SearchbarComponent {
  @Input() searchTerm: string = '';
  @Output() recipesEvent = new EventEmitter<any[]>();

  recipes!: Observable<Recipe[]>;

  constructor(private firestore: AngularFirestore) {}

  search() {
    if (!this.searchTerm.trim()) {
      return;
    }
    this.recipes = this.searchRecipes(this.searchTerm);
    this.recipes.subscribe((data) => {
      this.recipesEvent.emit(data);
    });
  }

  searchRecipes(searchTerm: string): Observable<any[]> {
    return this.firestore
      .collection('recipes', (ref) => ref.where('name', '==', searchTerm))
      .valueChanges();
  }
}
