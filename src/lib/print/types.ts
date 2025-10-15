/**
 * Print Shop Integration Types
 *
 * Types for print ordering, pricing, and fulfillment
 */

export interface PrintSize {
  id: string;
  name: string;
  width: number;
  height: number;
  unit: 'inches' | 'cm';
  price: number;
  description: string;
}

export interface PrintMaterial {
  id: string;
  name: string;
  type: 'photo-paper' | 'canvas' | 'metal' | 'acrylic';
  finish: 'glossy' | 'matte' | 'lustre' | 'metallic';
  priceMultiplier: number;
  description: string;
}

export interface PrintOptions {
  size: PrintSize;
  material: PrintMaterial;
  quantity: number;
  framing?: {
    enabled: boolean;
    style: 'black' | 'white' | 'wood' | 'silver' | 'gold';
    width: number;
  };
  mounting?: {
    enabled: boolean;
    type: 'foam-board' | 'gatorboard' | 'sintra' | 'aluminum';
    thickness: number;
  };
}

export interface PrintOrder {
  id: string;
  photoId: string;
  photoTitle: string;
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  options: PrintOptions;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  estimatedDelivery: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrintPriceCalculation {
  basePrice: number;
  materialCost: number;
  framingCost: number;
  mountingCost: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

// Print service configuration
export const PRINT_SIZES: PrintSize[] = [
  {
    id: '4x6',
    name: '4" × 6"',
    width: 4,
    height: 6,
    unit: 'inches',
    price: 3.99,
    description: 'Standard photo size'
  },
  {
    id: '5x7',
    name: '5" × 7"',
    width: 5,
    height: 7,
    unit: 'inches',
    price: 5.99,
    description: 'Popular portrait size'
  },
  {
    id: '8x10',
    name: '8" × 10"',
    width: 8,
    height: 10,
    unit: 'inches',
    price: 12.99,
    description: 'Classic frame size'
  },
  {
    id: '11x14',
    name: '11" × 14"',
    width: 11,
    height: 14,
    unit: 'inches',
    price: 24.99,
    description: 'Large display size'
  },
  {
    id: '16x20',
    name: '16" × 20"',
    width: 16,
    height: 20,
    unit: 'inches',
    price: 39.99,
    description: 'Gallery display size'
  },
  {
    id: '20x30',
    name: '20" × 30"',
    width: 20,
    height: 30,
    unit: 'inches',
    price: 79.99,
    description: 'Professional gallery size'
  }
];

export const PRINT_MATERIALS: PrintMaterial[] = [
  {
    id: 'photo-glossy',
    name: 'Photo Paper - Glossy',
    type: 'photo-paper',
    finish: 'glossy',
    priceMultiplier: 1.0,
    description: 'High-shine finish, vibrant colors'
  },
  {
    id: 'photo-matte',
    name: 'Photo Paper - Matte',
    type: 'photo-paper',
    finish: 'matte',
    priceMultiplier: 1.0,
    description: 'Non-reflective finish, elegant look'
  },
  {
    id: 'canvas-matte',
    name: 'Canvas - Matte',
    type: 'canvas',
    finish: 'matte',
    priceMultiplier: 2.5,
    description: 'Artist canvas texture, gallery quality'
  },
  {
    id: 'metal-glossy',
    name: 'Metal Print - Glossy',
    type: 'metal',
    finish: 'glossy',
    priceMultiplier: 3.0,
    description: 'Aluminum print, modern look, vibrant colors'
  },
  {
    id: 'acrylic-glossy',
    name: 'Acrylic - Glossy',
    type: 'acrylic',
    finish: 'glossy',
    priceMultiplier: 4.0,
    description: 'Crystal clear acrylic, depth and brilliance'
  }
];

export const FRAMING_OPTIONS = [
  { style: 'black', name: 'Black Wood', price: 25 },
  { style: 'white', name: 'White Wood', price: 25 },
  { style: 'wood', name: 'Natural Wood', price: 35 },
  { style: 'silver', name: 'Silver Metal', price: 45 },
  { style: 'gold', name: 'Gold Metal', price: 45 }
];

export const MOUNTING_OPTIONS = [
  { type: 'foam-board', name: 'Foam Board', thickness: 0.25, price: 15 },
  { type: 'gatorboard', name: 'Gatorboard', thickness: 0.5, price: 25 },
  { type: 'sintra', name: 'Sintra PVC', thickness: 0.25, price: 35 },
  { type: 'aluminum', name: 'Aluminum', thickness: 0.25, price: 50 }
];

// Tax and shipping rates
export const TAX_RATE = 0.08; // 8%
export const SHIPPING_RATES = {
  standard: 9.99, // 5-7 business days
  express: 19.99, // 2-3 business days
  overnight: 39.99 // Next business day
};