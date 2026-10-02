import { Category } from '../models/shop.models';

export const CATEGORIES: Category[] = [
  {
    id: 'electronics',
    name: 'Electronics',
    emoji: '🎧',
    description: 'Audio, wearables and smart gadgets',
    gradient: 'linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)',
  },
  {
    id: 'fashion',
    name: 'Fashion',
    emoji: '👕',
    description: 'Everyday style and comfort',
    gradient: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)',
  },
  {
    id: 'home',
    name: 'Home & living',
    emoji: '🛋️',
    description: 'Make every room feel new',
    gradient: 'linear-gradient(135deg, #ecfdf5 0%, #6ee7b7 100%)',
  },
  {
    id: 'beauty',
    name: 'Beauty',
    emoji: '💄',
    description: 'Skincare, makeup and grooming',
    gradient: 'linear-gradient(135deg, #fce7f3 0%, #f9a8d4 100%)',
  },
  {
    id: 'sports',
    name: 'Sports & outdoors',
    emoji: '🏃',
    description: 'Gear that keeps you moving',
    gradient: 'linear-gradient(135deg, #ecfeff 0%, #67e8f9 100%)',
  },
  {
    id: 'books',
    name: 'Books & media',
    emoji: '📚',
    description: 'Stories, skills and inspiration',
    gradient: 'linear-gradient(135deg, #ede9fe 0%, #c4b5fd 100%)',
  },
];
