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
  private isOnline?: boolean = true;

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService
  ) {}

  ngOnInit(): void {}

  get isOnlineStatus(): boolean {
    return this.isOnline!;
  }

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

  detectOnlineStatus(): void {
    window.addEventListener('offline', this.goOffline);
    window.addEventListener('online', this.syncWithFirestore);
  }

  goOffline = (): void => {
    console.log('App is offline. Switching to IndexedDB.');
    this.isOnline = false;
  };

  syncWithFirestore = (): void => {
    console.log('App is back online. Synchronizing with Firestore.');
    if (!this.isOnline) {
      this.isOnline = true;
      this.syncOperations();
    }
  };

  private async syncOperations(): Promise<void> {
    const transaction = this.db!.transaction(this.objectStoreName);
    const objectStore = transaction.objectStore(this.objectStoreName);

    objectStore.openCursor().onsuccess = async (event: any) => {
      const cursor = event.target.result;
      if (cursor) {
        const recipe: Recipe = cursor.value;
        const docRef = this.firestore
          .collection('recipes')
          .doc(recipe.id.toString());
        const doc = await docRef.get().toPromise();

        if (!doc?.exists) {
          // If the recipe does not exist in Firestore, add it
          await this.addRecipe(recipe);
        } else {
          // If the recipe exists in Firestore, update it
          this.modifyRecipe(recipe.id.toString(), recipe);
        }
        cursor.continue();
      }
    };
  }

  private createObjectStore() {
    const objectStore = this.db!.createObjectStore(this.objectStoreName, {
      keyPath: 'id',
      autoIncrement: true,
    });

    objectStore.createIndex('name', 'name', { unique: false });
  }

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

  getRecipes(): Observable<any[]> {
    return this.firestore.collection('recipes').valueChanges({ idField: 'id' });
  }

  async addRecipe(newRecipe: Recipe): Promise<void> {
    const recipeCollection = this.firestore.collection('recipes');
    return recipeCollection
      .add(newRecipe)
      .then((docRef) => {
        console.log('Recipe added with ID: ', docRef.id);
      })
      .catch((error) => {
        throw new Error(`Error adding recipe: ${error.message}`);
      });
  }

  async addRecipeToIndexedDB(newRecipe: Recipe): Promise<void> {
    const transaction = this.db!.transaction(this.objectStoreName, 'readwrite');
    const objectStore = transaction.objectStore(this.objectStoreName);
    newRecipe.id = this.firestore.createId();
    objectStore.add(newRecipe).onsuccess = (event: any) => {
      console.log('Recipe added with ID: ', event.target.result);
    };
  }

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

  likeRecipe(recipeId: string, newRecipeLike: number) {
    this.firestore.collection('recipes').doc(recipeId).update({
      likes: newRecipeLike,
    });
  }

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

  dislikeRecipe(recipeId: string, newRecipeDislike: number) {
    this.firestore.collection('recipes').doc(recipeId).update({
      dislikes: newRecipeDislike,
    });
  }

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

  deleteRecipe(recipeId: string): void {
    this.firestore.collection('recipes').doc(recipeId).delete();
  }

  deleteRecipeFromIndexedDB(recipeId: string): void {
    const transaction = this.db!.transaction(this.objectStoreName, 'readwrite');
    const objectStore = transaction.objectStore(this.objectStoreName);

    objectStore.delete(recipeId).onsuccess = (event: any) => {
      console.log('Recipe deleted with ID: ', event.target.result);
    };
  }

  modifyRecipe(id: string, recipe: Recipe): void {
    this.firestore.collection('recipes').doc(id).update(recipe);
  }

  modifyRecipeInIndexedDB(id: string, recipe: Recipe): void {
    const transaction = this.db!.transaction(this.objectStoreName, 'readwrite');
    const objectStore = transaction.objectStore(this.objectStoreName);

    objectStore.put(recipe).onsuccess = (event: any) => {
      console.log('Recipe modified with ID: ', event.target.result);
    };
  }

  setRecipeToModify(recipe: any): void {
    this.recipeToModify = recipe;
  }

  getRecipeToModify(): any {
    return this.recipeToModify;
  }
}
