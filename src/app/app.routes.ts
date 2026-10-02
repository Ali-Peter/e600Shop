import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'e600Shop — Home',
    loadComponent: () => import('./features/home/home').then((module) => module.Home),
  },
  {
    path: 'products',
    title: 'Shop all products — e600Shop',
    loadComponent: () => import('./features/products/products').then((module) => module.Products),
  },
  {
    path: 'products/:id',
    title: 'Product details — e600Shop',
    loadComponent: () =>
      import('./features/product-detail/product-detail').then((module) => module.ProductDetail),
  },
  {
    path: 'cart',
    title: 'Your cart — e600Shop',
    loadComponent: () => import('./features/cart/cart').then((module) => module.Cart),
  },
  {
    path: 'checkout',
    title: 'Checkout — e600Shop',
    loadComponent: () => import('./features/checkout/checkout').then((module) => module.Checkout),
  },
  {
    path: 'login',
    title: 'Sign in — e600Shop',
    loadComponent: () => import('./features/login/login').then((module) => module.Login),
  },
  { path: '**', redirectTo: '' },
];
