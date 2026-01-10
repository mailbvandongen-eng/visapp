import { useRef } from 'react'
import { Camera, X, ImagePlus } from 'lucide-react'
import { processImageForUpload, generatePhotoId } from '../../lib/imageUtils'
import type { PhotoData } from '../../store/catchStore'

const MAX_PHOTOS = 5

interface PhotoCaptureProps {
  photos: PhotoData[]
  onAddPhoto: (photo: PhotoData) => void
  onRemovePhoto: (photoId: string) => void
  disabled?: boolean
}

export function PhotoCapture({ photos, onAddPhoto, onRemovePhoto, disabled }: PhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const remainingSlots = MAX_PHOTOS - photos.length
    const filesToProcess = Array.from(files).slice(0, remainingSlots)

    for (const file of filesToProcess) {
      try {
        const { thumbnailBase64 } = await processImageForUpload(file)

        const photo: PhotoData = {
          id: generatePhotoId(),
          thumbnailBase64,
          createdAt: new Date().toISOString(),
          pendingUpload: true
        }

        onAddPhoto(photo)
      } catch (error) {
        console.error('Failed to process image:', error)
      }
    }

    // Reset input
    event.target.value = ''
  }

  const canAddMore = photos.length < MAX_PHOTOS

  return (
    <div className="space-y-2">
      <label className="block font-medium text-gray-700" style={{ fontSize: '0.9em' }}>
        Foto's ({photos.length}/{MAX_PHOTOS})
      </label>

      <div className="flex flex-wrap gap-2">
        {/* Existing photos */}
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
          >
            <img
              src={photo.thumbnailUrl || photo.thumbnailBase64}
              alt="Foto"
              className="w-full h-full object-cover"
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => onRemovePhoto(photo.id)}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-0 outline-none"
              >
                <X size={12} className="text-white" />
              </button>
            )}
            {photo.pendingUpload && (
              <div className="absolute bottom-0 left-0 right-0 bg-green-500/80 text-white text-center py-0.5" style={{ fontSize: '0.6em' }}>
                Lokaal
              </div>
            )}
          </div>
        ))}

        {/* Add photo buttons */}
        {canAddMore && !disabled && (
          <>
            {/* Camera button */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 flex flex-col items-center justify-center gap-1 transition-colors bg-transparent outline-none"
              title="Maak foto"
            >
              <Camera size={20} className="text-gray-400" />
              <span className="text-gray-400" style={{ fontSize: '0.6em' }}>Camera</span>
            </button>

            {/* Gallery button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 flex flex-col items-center justify-center gap-1 transition-colors bg-transparent outline-none"
              title="Kies foto"
            >
              <ImagePlus size={20} className="text-gray-400" />
              <span className="text-gray-400" style={{ fontSize: '0.6em' }}>Gallerij</span>
            </button>
          </>
        )}
      </div>

      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
