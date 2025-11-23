import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { X, Upload, Image as ImageIcon } from 'lucide-react'

interface ImageUploadProps {
  currentImageUrl?: string | null
  onUpload: (url: string | null) => Promise<void>
  label?: string
  bucket: 'profile-pictures' | 'gallery-pictures'
  userId: string
  maxSizeMB?: number
  accept?: string
}

export function ImageUpload({
  currentImageUrl,
  onUpload,
  label = 'Image',
  bucket,
  userId,
  maxSizeMB = 5,
  accept = 'image/*',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImageUrl ?? null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File size must be less than ${maxSizeMB}MB`)
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to Supabase Storage
    await uploadImage(file)
  }

  const uploadImage = async (file: File) => {
    try {
      setUploading(true)

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        // If file exists, try with a different name
        if (uploadError.message.includes('already exists')) {
          const newFileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
          const newFilePath = `${userId}/${newFileName}`
          
          const { error: retryError } = await supabase.storage
            .from(bucket)
            .upload(newFilePath, file, {
              cacheControl: '3600',
              upsert: false,
            })

          if (retryError) throw retryError

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(newFilePath)

          await onUpload(publicUrl)
          return
        }
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      await onUpload(publicUrl)
    } catch (error: any) {
      console.error('Error uploading image:', error)
      alert(error.message ?? 'Failed to upload image')
      setPreview(currentImageUrl ?? null)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = async () => {
    if (!currentImageUrl) return

    try {
      // Extract file path from URL
      const urlParts = currentImageUrl.split('/')
      const filePath = urlParts.slice(urlParts.indexOf(bucket) + 1).join('/')

      // Delete from storage
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath])

      if (error) {
        console.error('Error deleting image:', error)
        // Continue anyway - the URL might be from a different source
      }

      setPreview(null)
      await onUpload(null)
    } catch (error: any) {
      console.error('Error removing image:', error)
      alert('Failed to remove image')
    }
  }

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="flex items-center gap-4">
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-24 h-24 object-cover rounded-lg border border-border"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
              disabled={uploading}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="w-24 h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
          </div>
        )}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            id={`image-upload-${bucket}-${userId}`}
            disabled={uploading}
          />
          <label htmlFor={`image-upload-${bucket}-${userId}`}>
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              className="cursor-pointer"
              asChild
            >
              <span>
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : preview ? 'Change' : 'Upload'}
              </span>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground mt-1">
            Max size: {maxSizeMB}MB
          </p>
        </div>
      </div>
    </div>
  )
}

