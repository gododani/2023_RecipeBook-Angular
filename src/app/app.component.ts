import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Firestore } from '@angular/fire/firestore';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SearchbarComponent } from './components/searchbar/searchbar.component';
import { SwUpdate } from '@angular/service-worker';
import { Subscription, interval } from 'rxjs';
import { RecipeService } from './services/recipe.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NavbarComponent,
    SearchbarComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'recpiebook';
  private subscription?: Subscription;
  constructor(
    private firestore: Firestore,
    private swUpdate: SwUpdate,
    private recipeService: RecipeService
  ) {}

  ngOnInit(): void {
    this.recipeService.initDB();
    this.recipeService.detectOnlineStatus();

    if (this.recipeService.isOnlineStatus) {
      this.recipeService.loadItemsFromFirestore();
    } else {
      this.recipeService.loadItemsFromIndexedDB();
    }

    this.subscription = interval(3000).subscribe(() => {
      // Összehasonlítja a szerver-kliens manifest fájlokat
      this.swUpdate.checkForUpdate().then((update) => {
        /*
         Ha történt módosítás (új alkalmazás verzió érhető el),
         újratölti az alkalmazást és betölti az új/módosított fájlokat
        */
        if (update) {
          alert('New version is available, refresh the application!');
          window.location.reload();
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
