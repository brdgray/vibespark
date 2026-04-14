'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface Screenshot {
  id: string
  storage_path: string
  display_order: number
}

interface ScreenshotGalleryProps {
  screenshots: Screenshot[]
  startupName: string
}

export default function ScreenshotGallery({ screenshots, startupName }: ScreenshotGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  function prev() {
    setLightboxIndex(i => (i === null ? null : (i - 1 + screenshots.length) % screenshots.length))
  }

  function next() {
    setLightboxIndex(i => (i === null ? null : (i + 1) % screenshots.length))
  }

  return (
    <>
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="px-6 pt-5 pb-3 border-b bg-slate-50/50">
          <h2 className="text-sm font-semibold text-slate-700">Screenshots</h2>
        </div>
        <div className="p-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
            {screenshots.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setLightboxIndex(i)}
                className="flex-shrink-0 w-48 h-32 rounded-xl overflow-hidden border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <Image
                  src={s.storage_path}
                  alt={`${startupName} screenshot ${i + 1}`}
                  width={192}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxIndex !== null} onOpenChange={open => { if (!open) setLightboxIndex(null) }}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-0">
          <div className="relative flex items-center justify-center min-h-[60vh]">
            {lightboxIndex !== null && (
              <Image
                src={screenshots[lightboxIndex].storage_path}
                alt={`${startupName} screenshot ${lightboxIndex + 1}`}
                width={1200}
                height={800}
                className="max-h-[80vh] w-auto object-contain rounded-xl"
              />
            )}
            {screenshots.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            {lightboxIndex !== null && screenshots.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                {screenshots.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === lightboxIndex ? 'bg-white w-5' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
