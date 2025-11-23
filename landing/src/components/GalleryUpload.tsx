import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { X, Upload, Image as ImageIcon, Plus } from 'lucide-react'

interface GalleryImage {
  id?: string
  image_url: string
  display_order: number
}

interface GalleryUploadProps {
  profileId: string
  profileType: 'escort' | 'taxi'
  currentImages: GalleryImage[]
  onUpdate: () => Promise<void>
  maxImages?: number
}

export function GalleryUpload({
  profileId,
  profileType,
  currentImages,
  onUpdate,
  maxImages = 5,
}: GalleryUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<GalleryImage[]>(currentImages)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setImages(currentImages)
  }, [currentImages])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    // Check if adding these files would exceed the limit
    if (images.length + files.length > maxImages) {
      alert(`You can only upload up to ${maxImages} images. You currently have ${images.length} image(s).`)
      return
    }

    // Upload each file
    for (const file of files) {
      if (images.length >= maxImages) break
      await uploadImage(file)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadImage = async (file: File) => {
    try {
      setUploading(true)

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      // Get user ID for folder structure
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (!user || userError) {
        alert('You must be logged in to upload images')
        return
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('gallery-pictures')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gallery-pictures')
        .getPublicUrl(filePath)

      // Save to database using the function (bypasses RLS issues)
      const displayOrder = images.length
      
      // Try using the database function first (more reliable)
      const { data: pictureId, error: functionError } = await supabase.rpc('insert_profile_picture', {
        p_profile_id: profileId,
        p_profile_type: profileType,
        p_image_url: publicUrl,
        p_display_order: displayOrder,
      })

      if (functionError) {
        // If function doesn't exist or fails, try direct insert
        const { data: directData, error: directError } = await supabase
          .from('profile_pictures')
          .insert({
            profile_id: profileId,
            profile_type: profileType,
            image_url: publicUrl,
            display_order: displayOrder,
          })
          .select()
          .single()

        if (directError) {
          // Delete uploaded file if database insert fails
          await supabase.storage.from('gallery-pictures').remove([filePath])
          
          // If it's an RLS error, provide more helpful message
          if (directError.message?.includes('row-level security') || directError.message?.includes('RLS')) {
            throw new Error('Authentication error. Please sign out and sign in again, then try uploading the image.')
          }
          throw directError
        }

        // Update local state with direct insert result
        setImages(prev => [...prev, { 
          id: directData.id, 
          image_url: publicUrl, 
          display_order: displayOrder 
        }])
      } else {
        // Function succeeded - pictureId is the UUID returned
        setImages(prev => [...prev, { 
          id: pictureId, 
          image_url: publicUrl, 
          display_order: displayOrder 
        }])
      }

      // Refresh the gallery from database
      await onUpdate()
    } catch (error: any) {
      console.error('Error uploading image:', error)
      alert(error.message ?? 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async (imageId: string, imageUrl: string) => {
    if (!confirm('Are you sure you want to remove this image?')) return

    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('profile_pictures')
        .delete()
        .eq('id', imageId)

      if (dbError) throw dbError

      // Extract file path from URL and delete from storage
      try {
        const urlParts = imageUrl.split('/')
        const bucketIndex = urlParts.findIndex(part => part === 'gallery-pictures')
        if (bucketIndex !== -1) {
          const filePath = urlParts.slice(bucketIndex + 1).join('/')
          await supabase.storage.from('gallery-pictures').remove([filePath])
        }
      } catch (storageError) {
        console.error('Error deleting from storage:', storageError)
        // Continue anyway - the file might not exist
      }

      // Update local state
      setImages(prev => prev.filter(img => img.id !== imageId))
      await onUpdate()
    } catch (error: any) {
      console.error('Error removing image:', error)
      alert('Failed to remove image')
    }
  }

  const canAddMore = images.length < maxImages

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Gallery Pictures ({images.length}/{maxImages})
        </label>
        {canAddMore && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="gallery-upload"
              multiple
              disabled={uploading}
            />
            <label htmlFor="gallery-upload">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                className="cursor-pointer"
                asChild
              >
                <span>
                  <Plus className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Add Pictures'}
                </span>
              </Button>
            </label>
          </>
        )}
      </div>

      {images.length === 0 ? (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <ImageIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-4">
            No gallery pictures yet. Add up to {maxImages} pictures.
          </p>
          {canAddMore && (
            <label htmlFor="gallery-upload">
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                className="cursor-pointer"
                asChild
              >
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Pictures
                </span>
              </Button>
            </label>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <div key={image.id ?? index} className="relative group">
              <img
                src={image.image_url}
                alt={`Gallery ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-border"
              />
              <button
                type="button"
                onClick={() => image.id && handleRemove(image.id, image.image_url)}
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {canAddMore && (
            <label htmlFor="gallery-upload">
              <div className="w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors">
                <Plus className="w-8 h-8 text-muted-foreground/50" />
              </div>
            </label>
          )}
        </div>
      )}
    </div>
  )
}

