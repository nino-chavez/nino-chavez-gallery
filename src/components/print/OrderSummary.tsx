import type { Photo } from '@/types/photo';
import type { PrintOptions, PrintOrder } from '@/lib/print/types';
import { calculatePrintPrice, formatPrice, getEstimatedDelivery } from '@/lib/print/service';

interface OrderSummaryProps {
  photo: Photo;
  options: PrintOptions;
  customerInfo: PrintOrder['customerInfo'];
  shippingSpeed: 'standard' | 'express' | 'overnight';
  onShippingSpeedChange: (speed: 'standard' | 'express' | 'overnight') => void;
}

export function OrderSummary({
  photo,
  options,
  customerInfo,
  shippingSpeed,
  onShippingSpeedChange
}: OrderSummaryProps) {
  const pricing = calculatePrintPrice(options, shippingSpeed);
  const estimatedDelivery = getEstimatedDelivery(shippingSpeed);

  const shippingOptions = [
    {
      id: 'standard' as const,
      name: 'Standard Shipping',
      price: 9.99,
      time: '5-7 business days',
      description: 'Most economical option'
    },
    {
      id: 'express' as const,
      name: 'Express Shipping',
      price: 19.99,
      time: '2-3 business days',
      description: 'Faster delivery'
    },
    {
      id: 'overnight' as const,
      name: 'Overnight Shipping',
      price: 39.99,
      time: 'Next business day',
      description: 'Fastest delivery'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
      </div>

      {/* Photo Details */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <img
            src={photo.image_url}
            alt={photo.title}
            className="w-16 h-16 object-cover rounded-lg"
          />
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{photo.title}</h4>
            <p className="text-sm text-gray-600">{photo.caption}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {options.size.name}
              </span>
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                {options.material.name}
              </span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Qty: {options.quantity}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Shipping to:</h4>
        <div className="text-sm text-gray-600">
          <p>{customerInfo.name}</p>
          <p>{customerInfo.email}</p>
          <p>
            {customerInfo.address.street}, {customerInfo.address.city}, {customerInfo.address.state} {customerInfo.address.zipCode}
          </p>
        </div>
      </div>

      {/* Print Options Summary */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Print Details</h4>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Size:</span>
            <span>{options.size.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Material:</span>
            <span>{options.material.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Quantity:</span>
            <span>{options.quantity}</span>
          </div>

          {options.framing?.enabled && (
            <div className="flex justify-between">
              <span>Framing:</span>
              <span>{options.framing.style} (+${options.framing.width}")</span>
            </div>
          )}

          {options.mounting?.enabled && (
            <div className="flex justify-between">
              <span>Mounting:</span>
              <span>{options.mounting.type} ({options.mounting.thickness}")</span>
            </div>
          )}
        </div>
      </div>

      {/* Shipping Options */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Shipping Method</h4>

        <div className="space-y-2">
          {shippingOptions.map(option => (
            <button
              key={option.id}
              onClick={() => onShippingSpeedChange(option.id)}
              className={`w-full p-3 border-2 rounded-lg text-left transition-all ${
                shippingSpeed === option.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{option.name}</div>
                  <div className="text-sm text-gray-600">{option.description}</div>
                  <div className="text-sm text-blue-600">{option.time}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{formatPrice(option.price)}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="border-t pt-4 space-y-3">
        <h4 className="font-medium text-gray-900">Price Breakdown</h4>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatPrice(pricing.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>{formatPrice(pricing.tax)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping:</span>
            <span>{formatPrice(pricing.shipping)}</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span>{formatPrice(pricing.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Estimate */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-800">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span className="font-medium">Estimated Delivery:</span>
        </div>
        <p className="text-blue-700 mt-1">
          {estimatedDelivery.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Terms and Conditions */}
      <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
        <p>
          By placing this order, you agree to our terms of service.
          Orders are typically processed within 1-2 business days.
          Delivery times are estimates and may vary based on location and product availability.
        </p>
      </div>
    </div>
  );
}