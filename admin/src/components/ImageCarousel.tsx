import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface ImageCarouselProps {
  images: Array<{ id: string; image_url: string; display_order: number }>
  title?: string
}

export function ImageCarousel({ images, title = 'Gallery' }: ImageCarouselProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    if (!lightboxOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev - 1 + images.length) % images.length)
      }
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev + 1) % images.length)
      }
      if (e.key === 'Escape') {
        setLightboxOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen, images.length])

  if (images.length === 0) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-left">{title}</h3>
        <p className="text-sm text-white text-left">No pictures available</p>
      </div>
    )
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const nextLightbox = () => {
    setLightboxIndex((prev) => (prev + 1) % images.length)
  }

  const prevLightbox = () => {
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-left">{title}</h3>
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, index) => (
            <div
              key={img.id}
              className="relative aspect-square rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity cursor-pointer group"
              onClick={() => openLightbox(index)}
            >
              <img
                src={img.image_url}
                alt={`${title} ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-20 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="relative max-w-5xl w-full mx-4 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full h-[80vh] flex items-center justify-center bg-black/20 rounded-lg overflow-hidden">
              <img
                src={images[lightboxIndex].image_url}
                alt={`${title} ${lightboxIndex + 1}`}
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
              />
            </div>

            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    prevLightbox()
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-3 transition-all hover:scale-110 z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    nextLightbox()
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-3 transition-all hover:scale-110 z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-7 h-7" />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-4 py-2 rounded-full backdrop-blur-sm">
                  {lightboxIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

