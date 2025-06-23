'use client'

import { useState } from 'react'

export default function Dashboard() {
  const [productions, setProductions] = useState<Array<{id: number, name: string, date: string}>>([])
  const [newProduction, setNewProduction] = useState('')

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
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          onClick={() => {
            if (newProduction.trim()) {
              setProductions([...productions, { 
                id: Date.now(), 
                name: newProduction,
                date: new Date().toLocaleDateString()
              }])
              setNewProduction('')
            }
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Production
        </button>
      </div>

      <div className="space-y-4">
        {productions.map((prod) => (
          <div key={prod.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg">{prod.name}</h3>
            <p className="text-sm text-gray-500">Created: {prod.date}</p>
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
