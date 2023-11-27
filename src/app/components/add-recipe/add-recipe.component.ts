import { Component } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { RecipeService } from '../../services/recipe.service';
import { CommonModule } from '@angular/common';
import { Recipe } from '../../types/Recipe';

@Component({
  selector: 'app-add-recipe',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-recipe.component.html',
  styleUrl: './add-recipe.component.css',
})
export class AddRecipeComponent {
  recipeForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    imageUrl: new FormControl('', [Validators.required]),
    cookTime: new FormControl('', [Validators.required]),
    difficulty: new FormControl('', [Validators.required]),
    price: new FormControl('', [Validators.required]),
    serving: new FormControl('', [Validators.required, Validators.min(1)]),
    ingredients: new FormControl('', [Validators.required]),
    steps: new FormControl('', [Validators.required]),
  });

  errorMessage: string = '';

  constructor(private recipeService: RecipeService) {}

  addRecipe() {
    if (!this.recipeForm.valid) {
      return;
    }

    const {
      name,
      imageUrl,
      cookTime,
      difficulty,
      price,
      serving,
      ingredients,
      steps,
    } = this.recipeForm.value;

    const newRecipe = {
      name,
      imageUrl,
      cookTime,
      difficulty,
      price,
      serving,
      ingredients: ingredients!.split('\n'),
      steps: steps!.split('\n'),
    } as unknown as Recipe;

    this.recipeService.addRecipe(newRecipe);
  }

  getErrorMessage(controlName: string): string {
    const control = this.recipeForm.get(controlName);
    if (control?.hasError('required')) {
      return 'This field is required';
    } else if (control?.hasError('min')) {
      return 'The number must be at least 1';
    }
    return '';
  }
}
