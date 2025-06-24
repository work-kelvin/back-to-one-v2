'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProduction()
    loadLooks()
  }, [])

  const loadProduction = async () => {
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
  }

  const loadLooks = async () => {
    const { data, error } = await supabase
      .from('looks')
      .select('*')
      .eq('production_id', params.id)
      .order('sequence_order', { ascending: true })

    if (error) {
      console.error('Error loading looks:', error)
    } else {
      console.log('✅ Loaded looks:', data)
      setLooks(data || [])
    }
    setLoading(false)
  }

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

  const updateImageUrl = async (lookId: string, imageUrl: string) => {
    console.log('🔗 Updating image URL for look:', lookId, imageUrl)
    
    const { error } = await supabase
      .from('looks')
      .update({ image_url: imageUrl })
      .eq('id', lookId)

    if (error) {
      console.error('❌ Failed to update image URL:', error)
      alert('Failed to save image URL')
    } else {
      // Update local state
      setLooks(looks.map(look => 
        look.id === lookId 
          ? { ...look, image_url: imageUrl }
          : look
      ))
      console.log('✅ Image URL updated successfully')
    }
  }

  const moveUp = async (index: number) => {
    if (index === 0) return
    
    const newLooks = [...looks]
    const temp = newLooks[index]
    newLooks[index] = newLooks[index - 1]
    newLooks[index - 1] = temp
    
    // Update sequence orders
    newLooks[index].sequence_order = index
    newLooks[index - 1].sequence_order = index - 1
    
    setLooks(newLooks)
    
    // Update database
    await Promise.all([
      supabase.from('looks').update({ sequence_order: index }).eq('id', newLooks[index].id),
      supabase.from('looks').update({ sequence_order: index - 1 }).eq('id', newLooks[index - 1].id)
    ])
  }

  const moveDown = async (index: number) => {
    if (index === looks.length - 1) return
    
    const newLooks = [...looks]
    const temp = newLooks[index]
    newLooks[index] = newLooks[index + 1]
    newLooks[index + 1] = temp
    
    // Update sequence orders
    newLooks[index].sequence_order = index
    newLooks[index + 1].sequence_order = index + 1
    
    setLooks(newLooks)
    
    // Update database
    await Promise.all([
      supabase.from('looks').update({ sequence_order: index }).eq('id', newLooks[index].id),
      supabase.from('looks').update({ sequence_order: index + 1 }).eq('id', newLooks[index + 1].id)
    ])
  }

  const deleteLook = async (lookId: string) => {
    if (!confirm('Are you sure you want to delete this look?')) return

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
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 bg-gray-200 rounded"></div>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button 
              variant="outline" 
              onClick={() => router.push(`/productions/${params.id}`)}
              className="mb-4"
            >
              ← Back to Production
            </Button>
            <h1 className="text-3xl font-bold">{production?.name} - Looks</h1>
            <p className="text-gray-600">Visual styling concepts and references</p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {looks.length} Look{looks.length !== 1 ? 's' : ''}
          </Badge>
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
              <Card key={look.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{look.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="h-8 w-8 p-0"
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveDown(index)}
                        disabled={index === looks.length - 1}
                        className="h-8 w-8 p-0"
                      >
                        ↓
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteLook(look.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-100"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Image Display/URL Input */}
                  <div className="mb-4">
                    {look.image_url ? (
                      <div className="relative group">
                        <img
                          src={look.image_url}
                          alt={look.name}
                          className="w-full h-48 object-cover rounded-md"
                          onLoad={() => console.log('✅ Image loaded:', look.image_url)}
                          onError={(e) => {
                            console.error('❌ Image failed to load:', look.image_url)
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4='
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-md flex items-center justify-center">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              const url = prompt('Enter new image URL:', look.image_url || '')
                              if (url && url.trim()) {
                                updateImageUrl(look.id, url.trim())
                              }
                            }}
                          >
                            Change Image
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div
                          className="w-full h-48 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                          onClick={() => {
                            const url = prompt('Enter image URL:\n\nTip: Right-click any image online → "Copy image address"')
                            if (url && url.trim()) {
                              updateImageUrl(look.id, url.trim())
                            }
                          }}
                        >
                          <div className="text-center">
                            <div className="text-4xl mb-2">🖼️</div>
                            <p className="text-sm text-gray-600 font-medium">Click to add image URL</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Paste any image link from the web
                            </p>
                          </div>
                        </div>
                        <Input
                          placeholder="Or paste image URL here and press Enter..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const url = (e.target as HTMLInputElement).value.trim()
                              if (url) {
                                updateImageUrl(look.id, url)
                                ;(e.target as HTMLInputElement).value = ''
                              }
                            }
                          }}
                          className="text-sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Look Details */}
                  <div className="space-y-1 text-sm text-gray-600">
                    <div><strong>Sequence:</strong> {index + 1}</div>
                    <div><strong>Created:</strong> {new Date(look.created_at).toLocaleDateString()}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 