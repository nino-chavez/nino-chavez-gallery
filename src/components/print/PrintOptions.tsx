'use client';

import { useState, useEffect } from 'react';
import { PrintSizeSelector } from './PrintSizeSelector';
import { PrintMaterialSelector } from './PrintMaterialSelector';
import type { Photo } from '@/types/photo';
import type { PrintOptions as PrintOptionsType } from '@/lib/print/types';
import { getRecommendedPrintOptions, PRINT_SIZES, PRINT_MATERIALS } from '@/lib/print/service';

interface PrintOptionsProps {
  photo: Photo;
  options: PrintOptionsType | null;
  onChange: (options: PrintOptionsType) => void;
}

export function PrintOptions({ photo, options, onChange }: PrintOptionsProps) {
  const [selectedSize, setSelectedSize] = useState(PRINT_SIZES[2]); // Default to 8x10
  const [selectedMaterial, setSelectedMaterial] = useState(PRINT_MATERIALS[0]); // Default to glossy
  const [quantity, setQuantity] = useState(1);
  const [framing, setFraming] = useState({ enabled: false, style: '', width: 2 });
  const [mounting, setMounting] = useState({ enabled: false, type: '', thickness: 0.25 });

  // Initialize with recommended options based on photo metadata
  useEffect(() => {
    if (photo.metadata && !options) {
      const recommended = getRecommendedPrintOptions(photo.metadata);
      setSelectedSize(recommended.size);
      setSelectedMaterial(recommended.material);
      setQuantity(recommended.quantity);
    }
  }, [photo.metadata, options]);

  // Update parent component when options change
  useEffect(() => {
    const newOptions: PrintOptionsType = {
      size: selectedSize,
      material: selectedMaterial,
      quantity
    };

    if (framing.enabled) {
      newOptions.framing = framing;
    }

    if (mounting.enabled) {
      newOptions.mounting = mounting;
    }

    onChange(newOptions);
  }, [selectedSize, selectedMaterial, quantity, framing, mounting, onChange]);

  return (
    <div className="space-y-6">
      {/* Photo Preview */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <img
            src={photo.image_url}
            alt={photo.title}
            className="w-20 h-20 object-cover rounded-lg"
          />
          <div>
            <h3 className="font-medium text-gray-900">{photo.title}</h3>
            <p className="text-sm text-gray-600">{photo.caption}</p>
            {photo.metadata && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Quality: {photo.metadata.composition_score}/10
                </span>
                {photo.metadata.print_ready && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Print Ready
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Size Selection */}
      <PrintSizeSelector
        selectedSize={selectedSize}
        onSizeChange={setSelectedSize}
        photoMetadata={photo.metadata}
      />

      {/* Material Selection */}
      <PrintMaterialSelector
        selectedMaterial={selectedMaterial}
        onMaterialChange={setSelectedMaterial}
        photoMetadata={photo.metadata}
      />

      {/* Quantity */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Quantity
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
          >
            -
          </button>
          <span className="text-lg font-medium w-12 text-center">{quantity}</span>
          <button
            onClick={() => setQuantity(Math.min(50, quantity + 1))}
            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
          >
            +
          </button>
        </div>
      </div>

      {/* Optional Add-ons */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-medium text-gray-900">Optional Add-ons</h3>

        {/* Framing */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Add Framing</label>
              <p className="text-sm text-gray-500">Professional frame with UV-protective glass</p>
            </div>
            <button
              onClick={() => setFraming({ ...framing, enabled: !framing.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                framing.enabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                framing.enabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {framing.enabled && (
            <div className="ml-4 space-y-2">
              <label className="block text-sm text-gray-700">Frame Style</label>
              <select
                value={framing.style}
                onChange={(e) => setFraming({ ...framing, style: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select frame style</option>
                <option value="black">Black Wood - $25</option>
                <option value="white">White Wood - $25</option>
                <option value="wood">Natural Wood - $35</option>
                <option value="silver">Silver Metal - $45</option>
                <option value="gold">Gold Metal - $45</option>
              </select>
            </div>
          )}
        </div>

        {/* Mounting */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Add Mounting</label>
              <p className="text-sm text-gray-500">Ready-to-hang mounting board</p>
            </div>
            <button
              onClick={() => setMounting({ ...mounting, enabled: !mounting.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                mounting.enabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                mounting.enabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {mounting.enabled && (
            <div className="ml-4 space-y-2">
              <label className="block text-sm text-gray-700">Mounting Type</label>
              <select
                value={mounting.type}
                onChange={(e) => setMounting({ ...mounting, type: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select mounting type</option>
                <option value="foam-board">Foam Board (0.25") - $15</option>
                <option value="gatorboard">Gatorboard (0.5") - $25</option>
                <option value="sintra">Sintra PVC (0.25") - $35</option>
                <option value="aluminum">Aluminum (0.25") - $50</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}