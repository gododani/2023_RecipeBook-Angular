export type Recipe = {
  id : string;
  name: string;
  imageUrl: string;
  cookTime: string;
  likes: number;
  dislikes: number;
  ingredients: string[];
  steps: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  price: 'cheap' | 'normal' | 'expensive';
  serving: number;
}
