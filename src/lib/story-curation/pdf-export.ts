import type { NarrativeArc } from './narrative-arcs';

/**
 * Export story as PDF
 * Uses jsPDF for client-side PDF generation
 */
export async function exportStoryAsPDF(story: NarrativeArc): Promise<Blob> {
  // Dynamic import to reduce initial bundle size
  const { jsPDF } = await import('jspdf');

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;

  // Title page
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text(story.title, pageWidth / 2, 40, { align: 'center' });

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(story.description, pageWidth / 2, 55, { align: 'center', maxWidth: pageWidth - 40 });

  // Metadata
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text(`Quality: ${story.metadata.avgQuality}/10`, pageWidth / 2, 70, { align: 'center' });
  pdf.text(`Peak Moments: ${story.metadata.peakMoments}`, pageWidth / 2, 77, { align: 'center' });
  pdf.text(`Duration: ${story.metadata.duration}`, pageWidth / 2, 84, { align: 'center' });

  // Add photos
  for (let i = 0; i < story.photos.length; i++) {
    const photo = story.photos[i];
    const emotion = story.emotionalCurve[i];

    // New page for each photo
    if (i > 0) {
      pdf.addPage();
    } else {
      pdf.addPage();
    }

    // Fetch and add image
    try {
      const response = await fetch(photo.image_url);
      const blob = await response.blob();
      const imageData = await blobToBase64(blob);

      // Calculate dimensions to fit page
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = pageHeight - (margin * 4) - 20; // Leave space for caption

      pdf.addImage(imageData, 'JPEG', margin, margin, imgWidth, imgHeight);

      // Add caption
      pdf.setFontSize(10);
      pdf.setTextColor(0);
      pdf.text(
        `Photo ${i + 1}/${story.photos.length}`,
        margin,
        pageHeight - 15
      );

      // Add emotion and quality info
      pdf.text(
        `${emotion.emotion} • Intensity: ${emotion.intensity}/10`,
        pageWidth / 2,
        pageHeight - 15,
        { align: 'center' }
      );

      // Add timestamp
      pdf.text(
        new Date(emotion.timestamp).toLocaleString(),
        pageWidth - margin,
        pageHeight - 15,
        { align: 'right' }
      );
    } catch (error) {
      console.error(`Error adding image ${i + 1}:`, error);
      // Add placeholder text if image fails
      pdf.setFontSize(12);
      pdf.text(
        `[Image ${i + 1} unavailable]`,
        pageWidth / 2,
        pageHeight / 2,
        { align: 'center' }
      );
    }
  }

  // Generate blob
  return pdf.output('blob');
}

/**
 * Download PDF to user's device
 */
export async function downloadStoryPDF(story: NarrativeArc): Promise<void> {
  const blob = await exportStoryAsPDF(story);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${story.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper: Convert blob to base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}