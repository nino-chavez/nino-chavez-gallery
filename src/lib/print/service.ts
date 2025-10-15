/**
 * Print Shop Service
 *
 * Handles print pricing calculations and order management
 */

import {
  PrintOptions,
  PrintOrder,
  PrintPriceCalculation,
  PrintSize,
  PrintMaterial,
  PRINT_SIZES,
  PRINT_MATERIALS,
  FRAMING_OPTIONS,
  MOUNTING_OPTIONS,
  TAX_RATE,
  SHIPPING_RATES
} from './types';

export function calculatePrintPrice(options: PrintOptions, shippingSpeed: 'standard' | 'express' | 'overnight' = 'standard'): PrintPriceCalculation {
  const { size, material, quantity, framing, mounting } = options;

  // Base price from size and quantity
  const basePrice = size.price * quantity;

  // Material cost multiplier
  const materialCost = basePrice * (material.priceMultiplier - 1);

  // Framing cost
  const framingCost = framing?.enabled
    ? (FRAMING_OPTIONS.find(f => f.style === framing.style)?.price || 0) * quantity
    : 0;

  // Mounting cost
  const mountingCost = mounting?.enabled
    ? (MOUNTING_OPTIONS.find(m => m.type === mounting.type)?.price || 0) * quantity
    : 0;

  // Subtotal
  const subtotal = basePrice + materialCost + framingCost + mountingCost;

  // Tax
  const tax = subtotal * TAX_RATE;

  // Shipping
  const shipping = SHIPPING_RATES[shippingSpeed];

  // Total
  const total = subtotal + tax + shipping;

  return {
    basePrice,
    materialCost,
    framingCost,
    mountingCost,
    subtotal,
    tax,
    shipping,
    total
  };
}

export function getRecommendedPrintOptions(photoMetadata: any): PrintOptions {
  // Recommend options based on photo metadata
  let recommendedSize = PRINT_SIZES[2]; // Default to 8x10

  // If high quality and portfolio worthy, recommend larger sizes
  if (photoMetadata?.portfolio_worthy && photoMetadata?.composition_score >= 9) {
    recommendedSize = PRINT_SIZES.find(s => s.id === '16x20') || PRINT_SIZES[4];
  } else if (photoMetadata?.print_ready) {
    recommendedSize = PRINT_SIZES.find(s => s.id === '11x14') || PRINT_SIZES[3];
  }

  // Recommend material based on use case
  let recommendedMaterial = PRINT_MATERIALS[0]; // Default to glossy photo paper

  if (photoMetadata?.use_cases?.includes('athlete-portfolio')) {
    recommendedMaterial = PRINT_MATERIALS.find(m => m.id === 'canvas-matte') || PRINT_MATERIALS[2];
  } else if (photoMetadata?.emotion === 'triumph' || photoMetadata?.action_intensity === 'peak') {
    recommendedMaterial = PRINT_MATERIALS.find(m => m.id === 'metal-glossy') || PRINT_MATERIALS[3];
  }

  return {
    size: recommendedSize,
    material: recommendedMaterial,
    quantity: 1
  };
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function getEstimatedDelivery(shippingSpeed: 'standard' | 'express' | 'overnight'): Date {
  const now = new Date();
  const businessDays = {
    standard: 7, // 5-7 business days
    express: 3,  // 2-3 business days
    overnight: 1  // Next business day
  };

  // Add business days (simplified - doesn't account for weekends/holidays)
  const deliveryDate = new Date(now);
  deliveryDate.setDate(now.getDate() + businessDays[shippingSpeed]);

  return deliveryDate;
}

export async function createPrintOrder(
  photoId: string,
  photoTitle: string,
  options: PrintOptions,
  customerInfo: PrintOrder['customerInfo'],
  shippingSpeed: 'standard' | 'express' | 'overnight' = 'standard'
): Promise<PrintOrder> {
  const pricing = calculatePrintPrice(options, shippingSpeed);

  const order: PrintOrder = {
    id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    photoId,
    photoTitle,
    customerInfo,
    options,
    subtotal: pricing.subtotal,
    tax: pricing.tax,
    shipping: pricing.shipping,
    total: pricing.total,
    status: 'pending',
    estimatedDelivery: getEstimatedDelivery(shippingSpeed).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // In real implementation, this would:
  // 1. Save to database
  // 2. Process payment
  // 3. Send confirmation email
  // 4. Queue for fulfillment

  console.log('Print order created:', order);

  return order;
}

export function getPrintSizeForPhoto(photoWidth: number, photoHeight: number): PrintSize[] {
  const aspectRatio = photoWidth / photoHeight;

  return PRINT_SIZES.filter(size => {
    const sizeRatio = size.width / size.height;
    // Allow for reasonable aspect ratio difference (±0.2)
    return Math.abs(aspectRatio - sizeRatio) <= 0.2;
  });
}

export function validatePrintOptions(options: PrintOptions): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!options.size) {
    errors.push('Print size is required');
  }

  if (!options.material) {
    errors.push('Print material is required');
  }

  if (options.quantity < 1) {
    errors.push('Quantity must be at least 1');
  }

  if (options.quantity > 50) {
    errors.push('Maximum quantity is 50');
  }

  if (options.framing?.enabled && !options.framing.style) {
    errors.push('Frame style is required when framing is enabled');
  }

  if (options.mounting?.enabled && !options.mounting.type) {
    errors.push('Mounting type is required when mounting is enabled');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Re-export constants for convenience
export { PRINT_SIZES, PRINT_MATERIALS, FRAMING_OPTIONS, MOUNTING_OPTIONS };