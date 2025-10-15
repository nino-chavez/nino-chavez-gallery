import type { PrintMaterial } from '@/lib/print/types';
import { PRINT_MATERIALS } from '@/lib/print/service';

interface PrintMaterialSelectorProps {
  selectedMaterial: PrintMaterial;
  onMaterialChange: (material: PrintMaterial) => void;
  photoMetadata?: any;
}

export function PrintMaterialSelector({ selectedMaterial, onMaterialChange, photoMetadata }: PrintMaterialSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Print Material
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PRINT_MATERIALS.map(material => (
          <button
            key={material.id}
            onClick={() => onMaterialChange(material)}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              selectedMaterial.id === material.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full mt-1 ${
                material.finish === 'glossy' ? 'bg-blue-400' :
                material.finish === 'matte' ? 'bg-gray-400' :
                'bg-purple-400'
              }`} />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{material.name}</div>
                <div className="text-sm text-gray-600 mb-2">{material.description}</div>
                <div className="text-sm font-semibold text-green-600">
                  {material.priceMultiplier === 1 ? 'Base price' : `${material.priceMultiplier}x price`}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {photoMetadata?.portfolio_worthy && (
        <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
          💡 Portfolio-quality photo detected! Consider premium materials for best results.
        </div>
      )}
    </div>
  );
}