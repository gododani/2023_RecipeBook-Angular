import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, combineLatest, filter, map, of, switchMap } from 'rxjs';
import { Recipe } from '../types/Recipe';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  recipeToModify!: Recipe;
  private db?: IDBDatabase;
  private objectStoreName = 'recipes';
  public recipes$?: Observable<Recipe[]>;
  private isOnline?: boolean = navigator.onLine;

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService
  ) {
    window.addEventListener('online', () => (this.isOnline = true));
    window.addEventListener('offline', () => (this.isOnline = false));
  }

  ngOnInit(): void {

  }

  // Getter for the isOnline property.
  get isOnlineStatus(): boolean {
    return this.isOnline!;
  }

  // This function is initializing the IndexedDB.
  initDB() {
    const request = indexedDB.open('recipes-db', 2);

    request.onerror = (event: any) => {
      console.error('Database error:', event.target.error);
    };

    request.onupgradeneeded = (event: any) => {
      this.db = event.target.result;
      this.createObjectStore();
    };

    request.onsuccess = (event: any) => {
      this.db = event.target.result;
      //this.loadItems();
    };
  }

  // This metod is detecting the online status of the app.
  detectOnlineStatus(): void {
    window.addEventListener('offline', this.goOffline);
    window.addEventListener('online', this.syncWithFirestore);
  }

  // This function is called when the app is offline. It sets the isOnline property to false.
  goOffline = (): void => {
    console.log('App is offline. Switching to IndexedDB.');
    this.isOnline = false;
    console.log(this.isOnline);
  };

  // This function is called when the app is back online. It sets the isOnline property to true and calls the syncOperations() function.
  syncWithFirestore = async (): Promise<void> => {
    console.log('App is back online. Synchronizing with Firestore.');
    console.log(this.isOnline);
    if (!this.isOnline) {
      console.log('Inside of if');
      this.isOnline = true;
      console.log(this.isOnline);
      await this.syncOperations();
    }
  };

  // This function is getting all the recipes from IndexedDB and then it is calling the syncRecipesWithFirestore() function to synchronize the recipes with Firestore.
  private async syncOperations(): Promise<void> {
    const transaction = this.db!.transaction(this.objectStoreName);
    const objectStore = transaction.objectStore(this.objectStoreName);
    console.log('Syncing operations...');

    const recipes: Recipe[] = [];
    objectStore.openCursor().onsuccess = (event: any) => {
      const cursor = event.target.result;
      if (cursor) {
        recipes.push(cursor.value);
        cursor.continue();
      } else {
        this.syncRecipesWithFirestore(recipes);
      }
    };
  }

  // This function is going through all the recipes and checking if they exist in Firestore. If they do not exist, it is adding them to Firestore. If they exist, it is updating them.
  private async syncRecipesWithFirestore(recipes: Recipe[]): Promise<void> {
    for (const recipe of recipes) {
      const docRef = this.firestore
        .collection('recipes')
        .doc(recipe.id.toString());
      const doc = await docRef.get().toPromise();

      if (!doc!.exists) {
        // If the recipe does not exist in Firestore, add it
        console.log('Adding recipe to Firestore...');
        await this.addRecipe(recipe, recipe.id.toString());
        console.log('Recipe added to Firestore.');
      } else {
        // If the recipe exists in Firestore, update it
        console.log('Updating recipe in Firestore...');
        this.modifyRecipe(recipe.id.toString(), recipe);
        console.log('Recipe updated in Firestore.');
      }
    }
  }

  // This function is creating the object store in IndexedDB.
  private createObjectStore() {
    const objectStore = this.db!.createObjectStore(this.objectStoreName, {
      keyPath: 'id',
      autoIncrement: true,
    });

    objectStore.createIndex('name', 'name', { unique: false });
  }

  // This function is setting the recipes$ observable to the value of the recipes collection in Firestore.
  loadItemsFromFirestore(): void {
    this.getRecipes().subscribe((recipes) => {
      const transaction = this.db!.transaction(
        this.objectStoreName,
        'readwrite'
      );
      const objectStore = transaction.objectStore(this.objectStoreName);
      objectStore.clear(); // Clear the object store to avoid duplicating items

      recipes.forEach((recipe) => {
        objectStore.add(recipe);
      });
    });
  }

  // This function is setting the recipes$ observable to the value of the recipes from IndexedDB.
  loadItemsFromIndexedDB(): void {
    const transaction = this.db!.transaction(this.objectStoreName);
    const objectStore = transaction.objectStore(this.objectStoreName);

    this.recipes$ = new Observable<Recipe[]>((observer) => {
      const items: Recipe[] = [];

      objectStore.openCursor().onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor) {
          items.push(cursor.value);
          cursor.continue();
        } else {
          observer.next(items);
        }
      };
    });
  }

  private loadItems() {
    const objectStore = this.db!.transaction(this.objectStoreName).objectStore(
      this.objectStoreName
    );

    this.recipes$ = new Observable<Recipe[]>((observer) => {
      const items: Recipe[] = [];

      objectStore.openCursor().onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor) {
          items.push(cursor.value);
          cursor.continue();
        } else {
          observer.next(items);
        }
      };
    });
  }

  // This function is returning an observable of the recipes collection in Firestore.
  getRecipes(): Observable<any[]> {
    return this.firestore.collection('recipes').valueChanges({ idField: 'id' });
  }

  // This function is returning an observable of the recipes from IndexedDB.
  getRecipesFromIndexedDB(): Observable<Recipe[]> {
    return new Observable<Recipe[]>(observer => {
      const transaction = this.db!.transaction(this.objectStoreName, 'readonly');
      const objectStore = transaction.objectStore(this.objectStoreName);
      const request = objectStore.getAll();

      request.onsuccess = (event: any) => {
        observer.next(event.target.result);
        observer.complete();
      };

      request.onerror = (event: any) => {
        observer.error(event);
      };
    });
  }

  // This function is adding a new recipe to Firestore. If the recipe id is not provided, it is generated by the createId() function.
  async addRecipe(
    newRecipe: Recipe,
    id: string = this.firestore.createId()
  ): Promise<void> {
    const recipeCollection = this.firestore.collection('recipes');
    return recipeCollection
      .doc(id)
      .set(newRecipe)
      .then(() => {
        console.log('Recipe added with ID: ', id);
      })
      .catch((error) => {
        throw new Error(`Error adding recipe: ${error.message}`);
      });
  }

  // This function is adding a new recipe to IndexedDB. it generates the id by the createId() function.
  async addRecipeToIndexedDB(newRecipe: Recipe): Promise<void> {
    const transaction = this.db!.transaction(this.objectStoreName, 'readwrite');
    const objectStore = transaction.objectStore(this.objectStoreName);

    newRecipe.id = this.firestore.createId();

    objectStore.add(newRecipe).onsuccess = (event: any) => {
      console.log('Recipe added with ID: ', event.target.result);
    };
  }

  // This function is returning an observable of the favourite recipe ids of the current user.
  getFavouriteRecipeIds(): Observable<string[]> {
    return new Observable((observer) => {
      this.authService.getCurrentUserEmail().then((userEmail) => {
        this.firestore
          .collection('users', (ref) => ref.where('email', '==', userEmail))
          .get()
          .subscribe(
            (querySnapshot) => {
              if (querySnapshot.size === 0) {
                console.error('User not found in Firestore.');
                observer.next([]); // adding empty array
                observer.complete(); // Finish observable because there are no data
                return;
              }
              const userDocRef = querySnapshot.docs[0].ref;

              userDocRef
                .get()
                .then((doc) => {
                  const favourites = doc.get('favourites');
                  observer.next(favourites);
                  observer.complete();
                })
                .catch((error) => {
                  console.error('Error getting user document:', error);
                  observer.error(error);
                });
            },
            (error) => {
              console.error('Error querying users:', error);
              observer.error(error);
            }
          );
      });
    });
  }

  // This function is returning an observable of the favourite recipes of the current user.
  getUserFavouriteRecipes(): Observable<Recipe[]> {
    return this.getFavouriteRecipeIds().pipe(
      switchMap((recipeIds) => {
        if (recipeIds.length === 0) {
          // If there are no favorite recipe ids, return an empty array
          return of([]);
        }

        // Get recipes as observables
        const recipeObservables: Observable<Recipe | undefined>[] =
          recipeIds.map((id) =>
            this.firestore
              .doc<Recipe>(`recipes/${id}`)
              .valueChanges({ idField: 'id' })
              .pipe(
                // Filter out undefined values
                filter((recipe) => recipe !== undefined)
              )
          );

        // Use combineLatest to combine the latest values from all observables
        return combineLatest(recipeObservables).pipe(
          // Ensure that every array element is defined
          filter((recipes) => recipes.every((recipe) => recipe !== undefined)),
          // Convert the array of defined recipes
          map((recipes) => recipes as Recipe[])
        );
      })
    );
  }

  // This function is adding a recipe id to the favourite recipe ids of the current user.
  addToFavorites(recipeId: string): void {
    this.authService.getCurrentUserEmail().then((userEmail) => {
      if (!userEmail) {
        console.error('No logged in user.');
        return;
      }

      // Searching user based on email
      this.firestore
        .collection('users', (ref) => ref.where('email', '==', userEmail))
        .get()
        .subscribe(
          (querySnapshot) => {
            if (querySnapshot.size === 0) {
              console.error('User not found in Firestore.');
              return;
            }
            const userDocRef = querySnapshot.docs[0].ref;

            userDocRef
              .get()
              .then((doc) => {
                const favourites = doc.get('favourites') || [];

                if (!favourites.includes(recipeId)) {
                  favourites.push(recipeId);

                  // Update the document
                  userDocRef.update({
                    favourites: favourites,
                  });
                }
              })
              .catch((error) => {
                console.error('Error getting user document:', error);
              });
          },
          (error) => {
            console.error('Error querying users:', error);
          }
        );
    });
  }

  // This function is removing a recipe id from the favourite recipe ids of the current user.
  removeFromFavorites(recipeId: string): void {
    this.authService.getCurrentUserEmail().then((userEmail) => {
      if (!userEmail) {
        console.error('No logged in user.');
        return;
      }

      // Searching user based on email
      this.firestore
        .collection('users', (ref) => ref.where('email', '==', userEmail))
        .get()
        .subscribe(
          (querySnapshot) => {
            if (querySnapshot.size === 0) {
              console.error('User not found in Firestore.');
              return;
            }
            const userDocRef = querySnapshot.docs[0].ref;

            userDocRef
              .get()
              .then((doc) => {
                const favorites = doc.get('favourites') || [];

                // Remove recipeId from favorites array
                const updatedFavorites = favorites.filter(
                  (id: string) => id !== recipeId
                );

                // Update the document
                userDocRef.update({
                  favourites: updatedFavorites,
                });
              })
              .catch((error) => {
                console.error('Error getting user document:', error);
              });
          },
          (error) => {
            console.error('Error querying users:', error);
          }
        );
    });
  }

  // This function is returning the like count of a recipe based on the recipe id.
  getRecipeLikes(recipeId: string): Observable<number> {
    return new Observable((observer) => {
      this.firestore
        .collection('recipes')
        .doc(recipeId)
        .get()
        .subscribe(
          (doc) => {
            if (doc.exists) {
              const likes = (doc.data() as any)?.likes || 0;
              observer.next(likes);
              observer.complete();
            } else {
              console.error('Recipe not found in Firestore.');
              observer.next(0); // If recipe not found, return 0 likes
              observer.complete();
            }
          },
          (error) => {
            console.error('Error getting recipe document:', error);
            observer.error(error);
          }
        );
    });
  }

  // This function is returning the dislike count of a recipe based on the recipe id.
  getRecipeDislikes(recipeId: string): Observable<number> {
    return new Observable((observer) => {
      this.firestore
        .collection('recipes')
        .doc(recipeId)
        .get()
        .subscribe(
          (doc) => {
            if (doc.exists) {
              const dislikes = (doc.data() as any)?.dislikes || 0;
              observer.next(dislikes);
              observer.complete();
            } else {
              console.error('Recipe not found in Firestore.');
              observer.next(0); // If recipe not found, return 0 likes
              observer.complete();
            }
          },
          (error) => {
            console.error('Error getting recipe document:', error);
            observer.error(error);
          }
        );
    });
  }

  // This function is returning the liked recipe ids of the current user.
  getUserLikes(): Observable<string[]> {
    return new Observable((observer) => {
      this.authService.getCurrentUserEmail().then((userEmail) => {
        this.firestore
          .collection('users', (ref) => ref.where('email', '==', userEmail))
          .get()
          .subscribe(
            (querySnapshot) => {
              if (querySnapshot.size === 0) {
                console.error('User not found in Firestore.');
                observer.next([]); // adding empty array
                observer.complete(); // Finish observable because there are no data
                return;
              }
              const userDocRef = querySnapshot.docs[0].ref;

              userDocRef
                .get()
                .then((doc) => {
                  const likes = doc.get('likes');
                  observer.next(likes);
                  observer.complete();
                })
                .catch((error) => {
                  console.error('Error getting user document:', error);
                  observer.error(error);
                });
            },
            (error) => {
              console.error('Error querying users:', error);
              observer.error(error);
            }
          );
      });
    });
  }

  // This function is modifying the like count of a recipe based on the recipe id.
  likeRecipe(recipeId: string, newRecipeLike: number) {
    this.firestore.collection('recipes').doc(recipeId).update({
      likes: newRecipeLike,
    });
  }

  // This function is adding or removing a recipe id to the liked recipe ids of the current user.
  addUserLike(recipeId: string) {
    this.authService.getCurrentUserEmail().then((userEmail) => {
      if (!userEmail) {
        console.error('No logged in user.');
        return;
      }

      // Searching user based on email
      this.firestore
        .collection('users', (ref) => ref.where('email', '==', userEmail))
        .get()
        .subscribe(
          (querySnapshot) => {
            if (querySnapshot.size === 0) {
              console.error('User not found in Firestore.');
              return;
            }
            const userDocRef = querySnapshot.docs[0].ref;

            userDocRef
              .get()
              .then((doc) => {
                const likes = doc.get('likes') || [];

                if (!likes.includes(recipeId)) {
                  likes.push(recipeId);

                  // Update the document
                  userDocRef.update({
                    likes: likes,
                  });
                } else {
                  // Remove recipeId from favorites array
                  const updatedLikes = likes.filter(
                    (id: string) => id !== recipeId
                  );

                  // Update the document
                  userDocRef.update({
                    likes: updatedLikes,
                  });
                }
              })
              .catch((error) => {
                console.error('Error getting user document:', error);
              });
          },
          (error) => {
            console.error('Error querying users:', error);
          }
        );
    });
  }

  // This function is returning the disliked recipe ids of the current user.
  getUserDislikes(): Observable<string[]> {
    return new Observable((observer) => {
      this.authService.getCurrentUserEmail().then((userEmail) => {
        this.firestore
          .collection('users', (ref) => ref.where('email', '==', userEmail))
          .get()
          .subscribe(
            (querySnapshot) => {
              if (querySnapshot.size === 0) {
                console.error('User not found in Firestore.');
                observer.next([]); // adding empty array
                observer.complete(); // Finish observable because there are no data
                return;
              }
              const userDocRef = querySnapshot.docs[0].ref;

              userDocRef
                .get()
                .then((doc) => {
                  const dislikes = doc.get('dislikes');
                  observer.next(dislikes);
                  observer.complete();
                })
                .catch((error) => {
                  console.error('Error getting user document:', error);
                  observer.error(error);
                });
            },
            (error) => {
              console.error('Error querying users:', error);
              observer.error(error);
            }
          );
      });
    });
  }

  // This function is modifying the dislike count of a recipe based on the recipe id.
  dislikeRecipe(recipeId: string, newRecipeDislike: number) {
    this.firestore.collection('recipes').doc(recipeId).update({
      dislikes: newRecipeDislike,
    });
  }

  // This function is adding or removing a recipe id to the disliked recipe ids of the current user.
  addUserDislike(recipeId: string) {
    this.authService.getCurrentUserEmail().then((userEmail) => {
      if (!userEmail) {
        console.error('No logged in user.');
        return;
      }

      // Searching user based on email
      this.firestore
        .collection('users', (ref) => ref.where('email', '==', userEmail))
        .get()
        .subscribe(
          (querySnapshot) => {
            if (querySnapshot.size === 0) {
              console.error('User not found in Firestore.');
              return;
            }
            const userDocRef = querySnapshot.docs[0].ref;

            userDocRef
              .get()
              .then((doc) => {
                const dislikes = doc.get('dislikes') || [];

                if (!dislikes.includes(recipeId)) {
                  dislikes.push(recipeId);

                  // Update the document
                  userDocRef.update({
                    dislikes: dislikes,
                  });
                } else {
                  // Remove recipeId from favorites array
                  const updatedDislikes = dislikes.filter(
                    (id: string) => id !== recipeId
                  );

                  // Update the document
                  userDocRef.update({
                    dislikes: updatedDislikes,
                  });
                }
              })
              .catch((error) => {
                console.error('Error getting user document:', error);
              });
          },
          (error) => {
            console.error('Error querying users:', error);
          }
        );
    });
  }

  // This function is deleting a recipe from Firestore based on the recipe id.
  deleteRecipe(recipeId: string): void {
    this.firestore.collection('recipes').doc(recipeId).delete();
  }

  // This function is deleting a recipe from IndexedDB based on the recipe id.
  deleteRecipeFromIndexedDB(recipeId: string): void {
    const transaction = this.db!.transaction(this.objectStoreName, 'readwrite');
    const objectStore = transaction.objectStore(this.objectStoreName);

    objectStore.delete(recipeId).onsuccess = (event: any) => {
      console.log('Recipe deleted with ID: ', event.target.result);
    };
  }

  // This function is modifying a recipe in Firestore based on the recipe id.
  modifyRecipe(id: string, recipe: Recipe): void {
    this.firestore.collection('recipes').doc(id).update(recipe);
  }

  // This function is modifying a recipe in IndexedDB based on the recipe id.
  modifyRecipeInIndexedDB(id: string, recipe: Recipe): void {
    const transaction = this.db!.transaction(this.objectStoreName, 'readwrite');
    const objectStore = transaction.objectStore(this.objectStoreName);

    objectStore.put(recipe).onsuccess = (event: any) => {
      console.log('Recipe modified with ID: ', event.target.result);
    };
  }

  // This function is setting the recipeToModify property to the recipe that is going to be modified.
  setRecipeToModify(recipe: Recipe): void {
    this.recipeToModify = recipe;
  }

  // This function is returning the recipe that is going to be modified.
  getRecipeToModify(): Recipe {
    return this.recipeToModify;
  }
}
