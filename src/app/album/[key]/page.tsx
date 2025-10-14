import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { notFound } from 'next/navigation';
import Image from 'next/image';

interface Photo {
  imageKey: string;
  fileName: string;
  title: string;
  caption: string;
  keywords: string[];
  uploadDate: string;
  imageUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
}

interface Album {
  albumKey: string;
  name: string;
  description: string;
  urlName: string;
  photoCount: number;
  createdDate: string;
  lastUpdated: string;
  photos: Photo[];
}

interface GalleryContext {
  albums: Album[];
}

async function getAlbum(albumKey: string): Promise<Album | null> {
  const contextPath = resolve(process.cwd(), 'gallery-context.json');
  const data = await readFile(contextPath, 'utf-8');
  const context: GalleryContext = JSON.parse(data);

  return context.albums.find(a => a.albumKey === albumKey) || null;
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const album = await getAlbum(key);

  if (!album) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Albums
          </a>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {album.name}
          </h1>
          {album.description && (
            <p className="text-lg text-gray-600 mb-4">{album.description}</p>
          )}
          <div className="flex gap-4 text-sm text-gray-500">
            <span>{album.photoCount} photos</span>
            <span>Updated {new Date(album.lastUpdated).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {album.photos.map((photo) => (
            <div
              key={photo.imageKey}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden group"
            >
              <div className="relative aspect-square">
                <Image
                  src={photo.thumbnailUrl}
                  alt={photo.title || photo.fileName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              {photo.title && (
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                    {photo.title}
                  </h3>
                  {photo.caption && (
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {photo.caption}
                    </p>
                  )}
                  {photo.keywords.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {photo.keywords.slice(0, 3).map((keyword, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                        >
                          {keyword}
                        </span>
                      ))}
                      {photo.keywords.length > 3 && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded">
                          +{photo.keywords.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export async function generateStaticParams() {
  const contextPath = resolve(process.cwd(), 'gallery-context.json');
  const data = await readFile(contextPath, 'utf-8');
  const context: GalleryContext = JSON.parse(data);

  return context.albums.map((album) => ({
    key: album.albumKey,
  }));
}
