'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '../../../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Look {
  id: string
  name: string
  description: string
  image_url: string | null
  sequence_order: number
  styling_notes: string
  created_at: string
}

interface Production {
  id: string
  name: string
}

export default function LooksManagement() {
  const params = useParams()
  const router = useRouter()
  const [production, setProduction] = useState<Production | null>(null)
  const [looks, setLooks] = useState<Look[]>([])
  const [newLookName, setNewLookName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadProduction = useCallback(async () => {
    const { data, error } = await supabase
      .from('productions')
      .select('id, name')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error loading production:', error)
    } else {
      setProduction(data)
    }
  }, [params.id])

  const loadLooks = useCallback(async () => {
    const { data, error } = await supabase
      .from('looks')
      .select('*')
      .eq('production_id', params.id)
      .order('sequence_order', { ascending: true })

    if (error) {
      console.error('Error loading looks:', error)
    } else {
      setLooks(data || [])
    }
    setLoading(false)
  }, [params.id])

  useEffect(() => {
    loadProduction()
    loadLooks()
  }, [loadProduction, loadLooks])

  const createLook = async () => {
    if (!newLookName.trim()) return

    const nextOrder = looks.length > 0 ? Math.max(...looks.map(l => l.sequence_order)) + 1 : 0

    const { data, error } = await supabase
      .from('looks')
      .insert([{
        production_id: params.id,
        name: newLookName.trim(),
        description: '',
        sequence_order: nextOrder,
        styling_notes: ''
      }])
      .select()

    if (error) {
      console.error('Error creating look:', error)
    } else {
      setLooks([...looks, ...data])
      setNewLookName('')
    }
  }

  const uploadImage = async (lookId: string, file: File) => {
    setUploading(true)
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${lookId}-${Date.now()}.${fileExt}`
      const filePath = `looks/${fileName}`

      console.log('🚀 Uploading image:', fileName)

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('production-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('❌ Upload error:', uploadError)
        alert('Failed to upload image: ' + uploadError.message)
        setUploading(false)
        return
      }

      console.log('✅ Upload successful:', uploadData)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('production-images')
        .getPublicUrl(filePath)

      console.log('✅ Public URL:', publicUrl)

      // Update look with image URL
      const { error: updateError } = await supabase
        .from('looks')
        .update({ image_url: publicUrl })
        .eq('id', lookId)

      if (updateError) {
        console.error('❌ Database update error:', updateError)
        alert('Failed to save image URL: ' + updateError.message)
      } else {
        // Update local state
        setLooks(looks.map(look => 
          look.id === lookId 
            ? { ...look, image_url: publicUrl }
            : look
        ))
        console.log('✅ Look updated with image URL')
      }
    } catch (error) {
      console.error('❌ Unexpected error:', error)
      alert('Unexpected error uploading image')
    }
    
    setUploading(false)
  }

  const moveLook = async (fromIndex: number, toIndex: number) => {
    const items = Array.from(looks)
    const [reorderedItem] = items.splice(fromIndex, 1)
    items.splice(toIndex, 0, reorderedItem)

    // Update sequence_order for all items
    const updates = items.map((item, index) => ({
      id: item.id,
      sequence_order: index
    }))

    setLooks(items)

    // Update database
    for (const update of updates) {
      await supabase
        .from('looks')
        .update({ sequence_order: update.sequence_order })
        .eq('id', update.id)
    }
  }

  const deleteLook = async (lookId: string) => {
    const { error } = await supabase
      .from('looks')
      .delete()
      .eq('id', lookId)

    if (error) {
      console.error('Error deleting look:', error)
    } else {
      setLooks(looks.filter(look => look.id !== lookId))
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button 
              variant="outline" 
              onClick={() => router.push(`/productions/${params.id}`)}
              className="mb-4"
            >
              ← Back to Production
            </Button>
            <h1 className="text-3xl font-bold">{production?.name} - Looks</h1>
            <p className="text-gray-600">Manage styling concepts and visual references</p>
          </div>
          <Badge variant="secondary">{looks.length} Looks</Badge>
        </div>

        {/* Create New Look */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Look</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Look name (e.g., 'Casual Denim', 'Evening Glamour')"
                value={newLookName}
                onChange={(e) => setNewLookName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createLook()}
                className="flex-1"
              />
              <Button onClick={createLook}>Add Look</Button>
            </div>
          </CardContent>
        </Card>

        {/* Looks Gallery */}
        {looks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">👗</div>
              <h3 className="text-xl font-semibold mb-2">No looks yet</h3>
              <p className="text-gray-600">Add your first styling concept to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {looks.map((look, index) => (
              <Card key={look.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{look.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">#{index + 1}</Badge>
                      {index > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveLook(index, index - 1)}
                        >
                          ↑
                        </Button>
                      )}
                      {index < looks.length - 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveLook(index, index + 1)}
                        >
                          ↓
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteLook(look.id)}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Image Upload/Display */}
                  <div className="mb-4">
                    {look.image_url ? (
                      <div className="relative group">
                        <img
                          src={look.image_url}
                          alt={look.name}
                          className="w-full h-48 object-cover rounded-md border"
                          onError={(e) => {
                            console.error('Image failed to load:', look.image_url)
                            // Show placeholder on error
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4='
                          }}
                          onLoad={() => console.log('✅ Image loaded successfully:', look.image_url)}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-md flex items-center justify-center">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              const input = document.createElement('input')
                              input.type = 'file'
                              input.accept = 'image/*'
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0]
                                if (file) uploadImage(look.id, file)
                              }
                              input.click()
                            }}
                          >
                            Change Image
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="w-full h-48 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50"
                        onClick={() => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = 'image/*'
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0]
                            if (file) uploadImage(look.id, file)
                          }
                          input.click()
                        }}
                      >
                        <div className="text-center">
                          <div className="text-4xl mb-2">📸</div>
                          <p className="text-sm text-gray-600">
                            {uploading ? 'Uploading...' : 'Click to upload image'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-gray-600">
                    <p><strong>Sequence:</strong> {index + 1}</p>
                    <p><strong>Created:</strong> {new Date(look.created_at).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {uploading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                <p>Uploading image...</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
} 