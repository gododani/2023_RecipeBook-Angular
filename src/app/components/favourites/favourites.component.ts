import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../types/Recipe';

@Component({
  selector: 'app-favourites',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './favourites.component.html',
  styleUrl: './favourites.component.css',
})
export class FavouritesComponent {
  recipes: any[] = [];
  favouriteRecipeIds: string[] = [];
  userLikes: string[] = [];
  likes: { [recipeId: string]: number } = {};
  userDislikes: string[] = [];
  dislikes: { [recipeId: string]: number } = {};
  constructor(private recipeService: RecipeService) {}

  ngOnInit(): void {
    this.recipeService.getUserFavouriteRecipes().subscribe((data) => {
      this.recipes = data;
      console.log('recipes', this.recipes);
    });
    this.recipeService.getFavouriteRecipeIds().subscribe((data) => {
      this.favouriteRecipeIds = data;
      console.log('recipes', this.favouriteRecipeIds);
    });
    this.recipeService.getUserLikes().subscribe((data) => {
      this.userLikes = data;
    });
    this.recipeService.getUserDislikes().subscribe((data) => {
      this.userDislikes = data;
    });
  }

  isFavourite(recipeId: string): boolean {
    return this.favouriteRecipeIds.includes(recipeId);
  }

  toggleFavorite(recipeId: string) {
    if (this.isFavourite(recipeId)) {
      this.recipeService.removeFromFavorites(recipeId);

      // Removing locally from the array of ids for instant feedback to the user
      const updatedFavoritesIds = this.favouriteRecipeIds.filter(
        (id: string) => id !== recipeId
      );
      this.favouriteRecipeIds = updatedFavoritesIds;

      // Removing locally from the array of recipes for instant feedback to the user
      const updatedFavorites = this.recipes.filter(
        (recipe: any) => recipe?.id !== recipeId
      );
      this.recipes = updatedFavorites;
    } else {
      this.recipeService.addToFavorites(recipeId);

      // Adding locally to the array for instant feedback to the user
      this.favouriteRecipeIds.push(recipeId);
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
}
