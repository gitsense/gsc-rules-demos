import { z } from 'zod';

const CartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

const CheckoutRequestSchema = z.object({
  userId: z.string().uuid(),
  items: z.array(CartItemSchema).min(1),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
  }),
  paymentMethod: z.enum(['credit_card', 'paypal', 'bank_transfer']),
  couponCode: z.string().optional(),
});

type CartItem = z.infer<typeof CartItemSchema>;
type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;

interface CheckoutResult {
  orderId: string;
  status: 'pending' | 'confirmed' | 'failed';
  subtotal: number;
  discount: number;
  total: number;
  estimatedDelivery: string;
  items: CartItem[];
}

export async function processCheckout(request: unknown): Promise<CheckoutResult> {
  const parsed = CheckoutRequestSchema.parse(request);
  
  const subtotal = parsed.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  
  const tax = subtotal * 0.08;
  const shipping = subtotal > 100 ? 0 : 9.99;
  const discount = parsed.couponCode ? subtotal * 0.1 : 0;
  const total = subtotal + tax + shipping - discount;
  
  const orderId = crypto.randomUUID();
  const estimatedDelivery = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  return {
    orderId,
    status: 'confirmed',
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total: Math.round(total * 100) / 100,
    estimatedDelivery,
    items: parsed.items,
  };
}

export function validateCart(items: unknown[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (let i = 0; i < items.length; i++) {
    const result = CartItemSchema.safeParse(items[i]);
    if (!result.success) {
      errors.push(`Item ${i}: ${result.error.message}`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}
