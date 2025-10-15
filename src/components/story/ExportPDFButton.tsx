'use client';

import { useState } from 'react';
import type { NarrativeArc } from '@/lib/story-curation/narrative-arcs';

interface ExportPDFButtonProps {
  story: NarrativeArc;
}

export function ExportPDFButton({ story }: ExportPDFButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async () => {
    setIsExporting(true);
    
    try {
      // Dynamic import of jsPDF to reduce initial bundle size
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Title page
      doc.setFontSize(24);
      doc.text(story.title, 20, 30);
      
      doc.setFontSize(12);
      const descLines = doc.splitTextToSize(story.description, 170);
      doc.text(descLines, 20, 45);
      
      // Metadata
      doc.setFontSize(10);
      doc.text(`Average Quality: ${story.metadata.avgQuality}/10`, 20, 70);
      doc.text(`Peak Moments: ${story.metadata.peakMoments}`, 20, 80);
      doc.text(`Duration: ${story.metadata.duration}`, 20, 90);
      doc.text(`Story Type: ${story.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`, 20, 100);
      
      // Add a separator line
      doc.setLineWidth(0.5);
      doc.line(20, 110, 190, 110);
      
      doc.setFontSize(8);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 120);
      
      // Photos (one per page)
      for (let i = 0; i < story.photos.length; i++) {
        doc.addPage();
        const photo = story.photos[i];
        const emotion = story.emotionalCurve[i];
        
        // Photo number and emotion header
        doc.setFontSize(14);
        doc.text(`Photo ${i + 1} of ${story.photos.length}`, 20, 20);
        
        doc.setFontSize(10);
        doc.text(`Emotion: ${emotion.emotion.charAt(0).toUpperCase() + emotion.emotion.slice(1)} (Intensity: ${emotion.intensity}/10)`, 20, 30);
        
        // Load and add image
        try {
          const img = await loadImage(photo.image_url);
          const imgProps = calculateImageDimensions(img);
          
          // Add image centered on page
          doc.addImage(img, 'JPEG', imgProps.x, 40, imgProps.width, imgProps.height);
          
          // Add photo caption if available
          if (photo.caption) {
            doc.setFontSize(9);
            const captionLines = doc.splitTextToSize(photo.caption, 170);
            doc.text(captionLines, 20, imgProps.y + imgProps.height + 50);
          }
          
          // Add quality metrics at bottom
          if (photo.metadata) {
            doc.setFontSize(8);
            doc.setTextColor(100);
            const metricsY = 280;
            
            const metrics: string[] = [];
            if (photo.metadata.sharpness) metrics.push(`Sharpness: ${photo.metadata.sharpness}/10`);
            if (photo.metadata.composition_score) metrics.push(`Composition: ${photo.metadata.composition_score}/10`);
            if (photo.metadata.emotional_impact) metrics.push(`Impact: ${photo.metadata.emotional_impact}/10`);
            
            if (metrics.length > 0) {
              doc.text(metrics.join(' • '), 20, metricsY);
            }
            
            doc.setTextColor(0); // Reset to black
          }
          
        } catch (err) {
          console.error('Failed to load image:', err);
          doc.setFontSize(10);
          doc.setTextColor(200, 0, 0);
          doc.text('⚠ Image could not be loaded', 20, 50);
          doc.setTextColor(0);
        }
      }
      
      // Download with sanitized filename
      const filename = sanitizeFilename(`${story.title}-story.pdf`);
      doc.save(filename);
      
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to export PDF. Please try again or contact support if the issue persists.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={exportToPDF}
      disabled={isExporting}
      className="bg-white/20 backdrop-blur px-4 py-2 rounded-full hover:bg-white/30 transition text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Export story as PDF"
    >
      {isExporting ? '⏳ Exporting...' : '📄 Export PDF'}
    </button>
  );
}

// Helper functions

/**
 * Load an image with CORS support
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Enable CORS
    
    img.onload = () => resolve(img);
    img.onerror = (err) => {
      console.error('Image load error:', err);
      reject(new Error(`Failed to load image: ${url}`));
    };
    
    // Add timestamp to bypass cache if needed
    const urlWithCache = url.includes('?') ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`;
    img.src = urlWithCache;
  });
}

/**
 * Calculate image dimensions to fit A4 page (210mm x 297mm)
 * Keeping aspect ratio and centering horizontally
 */
function calculateImageDimensions(img: HTMLImageElement) {
  const maxWidth = 170; // mm (210 - 20 - 20 margins)
  const maxHeight = 220; // mm (leave space for header and footer)
  
  // Calculate scaling ratio to fit within bounds
  const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
  const width = img.width * ratio;
  const height = img.height * ratio;
  
  // Center horizontally (A4 width is 210mm)
  const x = (210 - width) / 2;
  const y = 40; // Start position after header
  
  return { x, y, width, height };
}

/**
 * Sanitize filename for safe file system usage
 */
function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9\-_.]/g, '') // Remove special characters
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}