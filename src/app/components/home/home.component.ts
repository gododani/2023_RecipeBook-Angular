import { AuthService } from './../../services/auth.service';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeService } from '../../services/recipe.service';
import { SearchbarComponent } from '../searchbar/searchbar.component';
import { FilterComponent } from '../filter/filter.component';
import { Recipe } from '../../types/Recipe';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SearchbarComponent, FilterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  recipes: any[] = [];
  favouriteRecipes: string[] = [];
  userLikes: string[] = [];
  likes: { [recipeId: string]: number } = {};
  userDislikes: string[] = [];
  dislikes: { [recipeId: string]: number } = {};
  userLoggedIn: boolean = false;
  isAdmin: boolean = false;
  selectedFilter = 'name';

  constructor(
    private recipeService: RecipeService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // If the user is online, get recipes from firebase and apply the filter, otherwise get them from indexedDB
    if (this.recipeService.isOnlineStatus) {
      this.recipeService.getRecipes().subscribe((data) => {
        this.recipes = data;
        this.applyFilter(this.selectedFilter);
      });
    } else {
      this.recipeService.getRecipesFromIndexedDB().then((data) => {
        this.recipes = data;
        this.applyFilter(this.selectedFilter);
      });
    }

    this.authService.isLoggedIn().then(async (loggedIn) => {
      this.userLoggedIn = loggedIn;

      if (this.userLoggedIn) {
        if (await this.authService.isAdmin()) {
          this.isAdmin = true;
        }
        this.recipeService.getFavouriteRecipeIds().subscribe((data) => {
          this.favouriteRecipes = data;
        });
        this.recipeService.getUserLikes().subscribe((data) => {
          this.userLikes = data;
        });
        this.recipeService.getUserDislikes().subscribe((data) => {
          this.userDislikes = data;
        });
      }
    });
  }

  isFavourite(recipeId: string): boolean {
    return this.favouriteRecipes.includes(recipeId);
  }

  toggleFavorite(recipeId: string) {
    if (this.isFavourite(recipeId)) {
      this.recipeService.removeFromFavorites(recipeId);
      // Removing locally from the array for instant feedback to the user
      const updatedFavorites = this.favouriteRecipes.filter(
        (id: string) => id !== recipeId
      );
      this.favouriteRecipes = updatedFavorites;
    } else {
      this.recipeService.addToFavorites(recipeId);
      // Adding locally to the array for instant feedback to the user
      this.favouriteRecipes.push(recipeId);
    }
  }

  isLiked(recipeId: string): boolean {
    return this.userLikes.includes(recipeId);
  }

  toggleLike(recipeId: string, recipeLike: number): void {
    if (!this.isLiked(recipeId)) {
      this.recipeService.likeRecipe(recipeId, recipeLike + 1);
      this.recipeService.addUserLike(recipeId);
      // Update the local likes count
      this.likes[recipeId] += 1;
      // Adding locally to the array for instant feedback to the user
      this.userLikes.push(recipeId);
    } else {
      this.recipeService.likeRecipe(recipeId, recipeLike - 1);
      this.recipeService.addUserLike(recipeId);
      // Update the local likes count
      this.likes[recipeId] -= 1;
      // Removing locally from the array for instant feedback to the user
      const updatedLikes = this.userLikes.filter(
        (id: string) => id !== recipeId
      );
      this.userLikes = updatedLikes;
    }
  }

  isDisliked(recipeId: string): boolean {
    return this.userDislikes.includes(recipeId);
  }

  toggleDislike(recipeId: string, recipeDislike: number): void {
    if (!this.isDisliked(recipeId)) {
      this.recipeService.dislikeRecipe(recipeId, recipeDislike + 1);
      this.recipeService.addUserDislike(recipeId);
      // Update the local dislikes count
      this.dislikes[recipeId] += 1;
      // Adding locally to the array for instant feedback to the user
      this.userDislikes.push(recipeId);
    } else {
      this.recipeService.dislikeRecipe(recipeId, recipeDislike - 1);
      this.recipeService.addUserDislike(recipeId);
      // Update the local dislikes count
      this.dislikes[recipeId] -= 1;
      // Removing locally from the array for instant feedback to the user
      const updatedDislikes = this.userDislikes.filter(
        (id: string) => id !== recipeId
      );
      this.userDislikes = updatedDislikes;
    }
  }

  applyFilter(filter: string) {
    switch (filter) {
      case 'name':
        this.recipes.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'likes':
        this.recipes.sort((a, b) => b.likes - a.likes);
        break;
      case 'dislikes':
        this.recipes.sort((a, b) => b.dislikes - a.dislikes);
        break;
    }
  }

  updateRecipes(recipes: Recipe[]) {
    this.recipes = recipes;
    this.applyFilter(this.selectedFilter);
  }

  deleteRecipe(recipeId: string): void {
    this.recipeService.deleteRecipeFromIndexedDB(recipeId);
    this.recipeService.deleteRecipe(recipeId);
  }

  modifyRecipe(recipe: Recipe): void {
    this.recipeService.setRecipeToModify(recipe);
    this.router.navigate(['/modify-recipe']);
  }
}
