import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, map } from 'rxjs';
import { Recipe } from '../types/Recipe';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService
  ) {}

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

  getFavouriteRecipes(): Observable<string[]> {
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
}
