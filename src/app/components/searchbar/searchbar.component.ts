import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Recipe } from '../../types/Recipe';
import { RecipeService } from '../../services/recipe.service';

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

  constructor(
    private firestore: AngularFirestore,
    private recipeService: RecipeService
  ) {}

  search() {
    // Check if the search term is empty or only contains whitespace
    if (!this.searchTerm.trim()) {
      // If the search term is empty, get all recipes
      this.recipes = this.recipeService.getRecipes();
      this.recipes.subscribe((data) => {
        this.recipesEvent.emit(data);
      });
    } else {
      // If the search term is not empty, search for recipes that match the search term
      this.recipes = this.searchRecipes(this.searchTerm);
      this.recipes.subscribe((data) => {
        this.recipesEvent.emit(data);
      });
    }
  }

  searchRecipes(searchTerm: string): Observable<any[]> {
    if (this.recipeService.isOnlineStatus) {
      return this.recipeService.searchRecipesInFirebase(searchTerm);
    } else {
      return this.recipeService.searchRecipesInIndexedDB(searchTerm);
    }
  }
}
