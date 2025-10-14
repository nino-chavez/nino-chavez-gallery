import { readFile } from 'fs/promises';
import { resolve } from 'path';

interface GalleryContext {
  username: string;
  generatedAt: string;
  totalAlbums: number;
  totalPhotos: number;
  enrichedPhotos: number;
  albums: Array<{
    albumKey: string;
    name: string;
    description: string;
    photoCount: number;
    lastUpdated: string;
  }>;
}

async function getGalleryContext(): Promise<GalleryContext> {
  const contextPath = resolve(process.cwd(), 'gallery-context.json');
  const data = await readFile(contextPath, 'utf-8');
  return JSON.parse(data);
}

export default async function HomePage() {
  const context = await getGalleryContext();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {context.username} Photography
          </h1>
          <p className="text-lg text-gray-600">
            {context.totalAlbums} albums · {context.totalPhotos} photos
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {context.albums.map((album) => (
            <a
              key={album.albumKey}
              href={`/album/${album.albumKey}`}
              className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {album.name}
              </h2>
              <p className="text-sm text-gray-600 mb-4">{album.description}</p>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{album.photoCount} photos</span>
                <span>
                  {new Date(album.lastUpdated).toLocaleDateString()}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
