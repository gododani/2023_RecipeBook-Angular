export type Recipe = {
  name: string;
  image: string;
  cookTime: string;
  ingredients: string[];
  steps: Map<number, { description: string }>;
  difficulty: 'easy' | 'medium' | 'hard';
  price: 'cheap' | 'normal' | 'expensive';
  quantity: number;
}
