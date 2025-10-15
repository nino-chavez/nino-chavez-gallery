'use client';

import { useState } from 'react';
import type { PrintOrder } from '@/lib/print/types';

interface CustomerInfoFormProps {
  info: PrintOrder['customerInfo'] | null;
  onChange: (info: PrintOrder['customerInfo']) => void;
}

export function CustomerInfoForm({ info, onChange }: CustomerInfoFormProps) {
  const [formData, setFormData] = useState<PrintOrder['customerInfo']>(
    info || {
      name: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US'
      }
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.address.street.trim()) {
      newErrors['address.street'] = 'Street address is required';
    }

    if (!formData.address.city.trim()) {
      newErrors['address.city'] = 'City is required';
    }

    if (!formData.address.state.trim()) {
      newErrors['address.state'] = 'State is required';
    }

    if (!formData.address.zipCode.trim()) {
      newErrors['address.zipCode'] = 'ZIP code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onChange(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Information</h3>
        <p className="text-sm text-gray-600 mb-6">
          We'll use this information to process and ship your order.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full p-3 border rounded-lg ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="John Doe"
          />
          {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Email */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full p-3 border rounded-lg ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="john@example.com"
          />
          {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            placeholder="(555) 123-4567"
          />
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Street Address *
          </label>
          <input
            type="text"
            value={formData.address.street}
            onChange={(e) => handleInputChange('address.street', e.target.value)}
            className={`w-full p-3 border rounded-lg ${
              errors['address.street'] ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="123 Main Street"
          />
          {errors['address.street'] && <p className="text-red-600 text-sm mt-1">{errors['address.street']}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City *
          </label>
          <input
            type="text"
            value={formData.address.city}
            onChange={(e) => handleInputChange('address.city', e.target.value)}
            className={`w-full p-3 border rounded-lg ${
              errors['address.city'] ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="New York"
          />
          {errors['address.city'] && <p className="text-red-600 text-sm mt-1">{errors['address.city']}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State *
          </label>
          <input
            type="text"
            value={formData.address.state}
            onChange={(e) => handleInputChange('address.state', e.target.value)}
            className={`w-full p-3 border rounded-lg ${
              errors['address.state'] ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="NY"
          />
          {errors['address.state'] && <p className="text-red-600 text-sm mt-1">{errors['address.state']}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ZIP Code *
          </label>
          <input
            type="text"
            value={formData.address.zipCode}
            onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
            className={`w-full p-3 border rounded-lg ${
              errors['address.zipCode'] ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="10001"
          />
          {errors['address.zipCode'] && <p className="text-red-600 text-sm mt-1">{errors['address.zipCode']}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country *
          </label>
          <select
            value={formData.address.country}
            onChange={(e) => handleInputChange('address.country', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="MX">Mexico</option>
          </select>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
        <p>
          Your information is secure and will only be used to process this order.
          We respect your privacy and will not share your information with third parties.
        </p>
      </div>
    </div>
  );
}