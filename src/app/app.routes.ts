import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { FavouritesComponent } from './components/favourites/favourites.component';
import { AddRecipeComponent } from './components/add-recipe/add-recipe.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { NotFoundComponent } from './components/not-found/not-found.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'favorites', component: FavouritesComponent },
  { path: 'add-recipe', component: AddRecipeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '**', component: NotFoundComponent },
];
