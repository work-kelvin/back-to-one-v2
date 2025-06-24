'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface Production {
  id: string
  name: string
  created_at: string
}

export default function Dashboard() {
  const router = useRouter()
  const [productions, setProductions] = useState<Production[]>([])
  const [newProduction, setNewProduction] = useState('')
  const [loading, setLoading] = useState(false)

  // Load productions on page load
  useEffect(() => {
    loadProductions()
  }, [])

  const loadProductions = async () => {
    console.log('🚀 Loading productions from database...')
    const { data, error } = await supabase
      .from('productions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error loading productions:', error)
    } else {
      console.log('📊 Loaded productions:', data)
      setProductions(data || [])
    }
  }

  const createProduction = async () => {
    if (!newProduction.trim()) return

    setLoading(true)
    console.log('🚀 Creating production:', newProduction)
    
    const { data, error } = await supabase
      .from('productions')
      .insert([{ name: newProduction.trim() }])
      .select()

    if (error) {
      console.error('❌ Error creating production:', error)
    } else {
      console.log('✅ Created production:', data)
      setProductions([...data, ...productions])
      setNewProduction('')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Back To One</h1>
          <p className="text-xl text-gray-600">Fashion Production Management Platform</p>
        </div>

        {/* Create Production Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Production</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input 
                type="text"
                placeholder="Enter production name..."
                value={newProduction}
                onChange={(e) => setNewProduction(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createProduction()}
                className="flex-1"
              />
              <Button 
                onClick={createProduction}
                disabled={loading}
                className="px-6"
              >
                {loading ? 'Creating...' : 'Create Production'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator className="mb-8" />

        {/* Productions Grid */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Your Productions</h2>
          
          {productions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-gray-500">
                  <div className="text-6xl mb-4">🎬</div>
                  <h3 className="text-xl font-semibold mb-2">No productions yet</h3>
                  <p>Create your first fashion shoot production to get started</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productions.map((prod) => (
                <Card 
                  key={prod.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/productions/${prod.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{prod.name}</CardTitle>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>
                        <strong>Created:</strong> {new Date(prod.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Badge variant="secondary" className="text-xs">
                          Setup
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Planning
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {productions.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600">{productions.length}</div>
                  <div className="text-gray-600">Total Productions</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">{productions.length}</div>
                  <div className="text-gray-600">Active Projects</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">0</div>
                  <div className="text-gray-600">Completed Shoots</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}