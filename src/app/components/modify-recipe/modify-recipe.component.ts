import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeService } from '../../services/recipe.service';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Recipe } from '../../types/Recipe';

@Component({
  selector: 'app-modify-recipe',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modify-recipe.component.html',
  styleUrl: './modify-recipe.component.css',
})
export class ModifyRecipeComponent {
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

  ngOnInit(): void {
    const recipe = this.recipeService.getRecipeToModify();
    this.recipeForm.setValue({
      name: recipe.name,
      imageUrl: recipe.imageUrl,
      cookTime: recipe.cookTime,
      difficulty: recipe.difficulty,
      price: recipe.price,
      serving: recipe.serving,
      ingredients: recipe.ingredients.join('\n'),
      steps: recipe.steps.join('\n'),
    });
  }

  getRows(controlName: string): number {
    const controlValue = this.recipeForm.get(controlName)?.value;
    return controlValue ? (controlValue.match(/\n/g) || '').length + 1 : 1;
  }

  modifyRecipe(): void {
    if (this.recipeForm.valid) {
      const recipe = this.recipeForm.value;
      const modifiedRecipe: Recipe = {
        id: this.recipeService.getRecipeToModify().id,
        name: recipe.name ?? '',
        imageUrl: recipe.imageUrl ?? '',
        cookTime: recipe.cookTime ?? '',
        difficulty: recipe.difficulty as 'easy' | 'medium' | 'hard',
        price: recipe.price as 'cheap' | 'normal' | 'expensive',
        serving: Number(recipe.serving),
        ingredients: (recipe.ingredients ?? '').split('\n'),
        steps: recipe.steps!.split('\n'),
        likes: this.recipeService.getRecipeToModify().likes,
        dislikes: this.recipeService.getRecipeToModify().dislikes,
      };
      if (this.recipeService.isOnlineStatus) {
        this.recipeService.modifyRecipe(
          modifiedRecipe.id.toString(),
          modifiedRecipe
        );
      } else {
        this.recipeService.modifyRecipeInIndexedDB(
          modifiedRecipe.id.toString(),
          modifiedRecipe
        );
      }
    }
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
