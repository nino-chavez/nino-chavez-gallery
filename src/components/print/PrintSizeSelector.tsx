import type { PrintSize } from '@/lib/print/types';
import { PRINT_SIZES } from '@/lib/print/service';

interface PrintSizeSelectorProps {
  selectedSize: PrintSize;
  onSizeChange: (size: PrintSize) => void;
  photoMetadata?: any;
}

export function PrintSizeSelector({ selectedSize, onSizeChange, photoMetadata }: PrintSizeSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Print Size
      </label>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {PRINT_SIZES.map(size => (
          <button
            key={size.id}
            onClick={() => onSizeChange(size)}
            className={`p-3 border-2 rounded-lg text-left transition-all ${
              selectedSize.id === size.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-900">{size.name}</div>
            <div className="text-sm text-gray-600">{size.description}</div>
            <div className="text-sm font-semibold text-green-600 mt-1">
              ${size.price}
            </div>
          </button>
        ))}
      </div>

      {photoMetadata?.print_ready && (
        <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
          💡 This photo is print-ready! Recommended sizes are highlighted.
        </div>
      )}
    </div>
  );
}