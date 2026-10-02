import { CartService, FLAT_SHIPPING_RATE, FREE_SHIPPING_THRESHOLD } from './cart.service';
import { Product } from '../models/shop.models';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    name: 'Test product',
    description: 'A product used in unit tests.',
    price: 20,
    category: 'electronics',
    rating: 4.5,
    reviews: 10,
    stock: 5,
    emoji: '🎧',
    gradient: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
    ...overrides,
  };
}

describe('CartService', () => {
  it('adds items and aggregates count and subtotal', () => {
    const cart = new CartService();
    cart.add(makeProduct());
    cart.add(makeProduct(), 2);

    expect(cart.items()).toHaveLength(1);
    expect(cart.count()).toBe(3);
    expect(cart.subtotal()).toBe(60);
    expect(cart.isEmpty()).toBe(false);
  });

  it('updates quantities and removes items', () => {
    const cart = new CartService();
    cart.add(makeProduct());

    cart.updateQuantity('p1', 4);
    expect(cart.quantityOf('p1')).toBe(4);

    cart.updateQuantity('p1', 0);
    expect(cart.isEmpty()).toBe(true);

    cart.add(makeProduct());
    cart.remove('p1');
    expect(cart.count()).toBe(0);
  });

  it('charges flat shipping below the free shipping threshold', () => {
    const cart = new CartService();
    cart.add(makeProduct({ price: 40 }));

    expect(cart.shipping()).toBe(FLAT_SHIPPING_RATE);
    expect(cart.total()).toBe(40 + FLAT_SHIPPING_RATE);
  });

  it('grants free shipping at the threshold and when the cart is empty', () => {
    const cart = new CartService();
    expect(cart.shipping()).toBe(0);

    cart.add(makeProduct({ price: FREE_SHIPPING_THRESHOLD }));
    expect(cart.shipping()).toBe(0);
    expect(cart.total()).toBe(FREE_SHIPPING_THRESHOLD);
  });

  it('clears the cart', () => {
    const cart = new CartService();
    cart.add(makeProduct());

    cart.clear();
    expect(cart.isEmpty()).toBe(true);
    expect(cart.count()).toBe(0);
  });
});
