'use client';

import { useState } from 'react';
import type { Photo } from '@/types/photo';

interface DownloadPackButtonProps {
  photos: Photo[];
  packType: 'portfolio' | 'social' | 'print';
}

export function DownloadPackButton({ photos, packType }: DownloadPackButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const getPackDetails = () => {
    switch (packType) {
      case 'portfolio':
        return {
          title: 'Portfolio Pack',
          description: 'High-quality photos for professional use',
          icon: '⭐',
          color: 'bg-yellow-600 hover:bg-yellow-700'
        };
      case 'social':
        return {
          title: 'Social Media Pack',
          description: 'Optimized photos for social sharing',
          icon: '📱',
          color: 'bg-blue-600 hover:bg-blue-700'
        };
      case 'print':
        return {
          title: 'Print Pack',
          description: 'Print-ready high-resolution photos',
          icon: '🖨️',
          color: 'bg-green-600 hover:bg-green-700'
        };
    }
  };

  const handleDownload = async () => {
    if (photos.length === 0) return;

    setIsGenerating(true);

    try {
      // Simulate pack generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In real implementation, this would:
      // 1. Generate a ZIP file with selected photos
      // 2. Apply any necessary processing (watermarks, resizing, etc.)
      // 3. Upload to cloud storage
      // 4. Generate download link

      setIsGenerated(true);

      // Auto-download after generation
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = '/api/download-pack'; // Would need to implement this API
        link.download = `${packType}-pack-${Date.now()}.zip`;
        link.click();
      }, 1000);

    } catch (error) {
      console.error('Failed to generate pack:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const packDetails = getPackDetails();

  if (photos.length === 0) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
      >
        No photos available
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleDownload}
        disabled={isGenerating || isGenerated}
        className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 ${
          isGenerating || isGenerated
            ? 'bg-gray-400 cursor-not-allowed'
            : packDetails.color
        }`}
      >
        {isGenerating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            Generating...
          </>
        ) : isGenerated ? (
          <>
            <span>✅</span>
            Downloaded!
          </>
        ) : (
          <>
            <span>{packDetails.icon}</span>
            Download Pack ({photos.length})
          </>
        )}
      </button>

      <div className="text-right">
        <div className="text-sm font-medium text-gray-900">{packDetails.title}</div>
        <div className="text-xs text-gray-600">{packDetails.description}</div>
      </div>
    </div>
  );
}