'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Production {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export default function ProductionDetail() {
  const params = useParams()
  const router = useRouter()
  const [production, setProduction] = useState<Production | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [loading, setLoading] = useState(true)

  const loadProduction = useCallback(async () => {
    const { data, error } = await supabase
      .from('productions')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error loading production:', error)
    } else {
      setProduction(data)
      setEditName(data.name)
    }
    setLoading(false)
  }, [params.id])

  useEffect(() => {
    loadProduction()
  }, [params.id, loadProduction])

  const updateProduction = async () => {
    if (!editName.trim() || !production) return

    const { error } = await supabase
      .from('productions')
      .update({ 
        name: editName.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', production.id)

    if (error) {
      console.error('Error updating production:', error)
    } else {
      setProduction({ ...production, name: editName.trim() })
      setIsEditing(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!production) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-600">Production not found</h1>
        <Button onClick={() => router.push('/')} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.push('/')}
        >
          ← Back to Dashboard
        </Button>
        <Badge variant="secondary">
          Production #{production.id.slice(0, 8)}
        </Badge>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            {isEditing ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-2xl font-bold"
                  onKeyPress={(e) => e.key === 'Enter' && updateProduction()}
                />
                <Button onClick={updateProduction} size="sm">Save</Button>
                <Button 
                  onClick={() => {
                    setIsEditing(false)
                    setEditName(production.name)
                  }} 
                  variant="outline" 
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-3xl">{production.name}</CardTitle>
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  Edit Name
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <strong>Created:</strong> {new Date(production.created_at).toLocaleString()}
            </div>
            <div>
              <strong>Last Updated:</strong> {new Date(production.updated_at).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Sections - Coming Soon */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Looks & Styling</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Manage looks, outfits, and styling requirements</p>
            <Button 
              onClick={() => router.push(`/productions/${production.id}/looks`)}
              className="w-full"
            >
              Manage Looks
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Call Sheet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Generate professional call sheets</p>
            <Button 
              onClick={() => router.push(`/productions/${production.id}/call-sheet`)}
              className="w-full"
            >
              Generate Call Sheet
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Plan your shoot timeline</p>
            <Button variant="outline" className="w-full">
              Build Schedule (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Track gear and equipment</p>
            <Button variant="outline" className="w-full">
              Manage Equipment (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 