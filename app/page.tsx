'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface Production {
  id: string
  name: string
  created_at: string
}

export default function Dashboard() {
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
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Back To One</h1>
      <p className="text-gray-600 mb-8">Fashion Production Management</p>
      
      <div className="flex gap-2 mb-6">
        <input 
          type="text"
          placeholder="New production name..."
          value={newProduction}
          onChange={(e) => setNewProduction(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && createProduction()}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          onClick={createProduction}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Production'}
        </button>
      </div>

      <div className="space-y-4">
        {productions.map((prod) => (
          <div key={prod.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg">{prod.name}</h3>
            <p className="text-sm text-gray-500">
              Created: {new Date(prod.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      {productions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No productions yet. Create your first fashion shoot!</p>
        </div>
      )}
    </div>
  )
}