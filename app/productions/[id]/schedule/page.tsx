'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface Production {
  id: string
  name: string
  shoot_date: string | null
  shoot_start_time: string | null
  shoot_end_time: string | null
}

interface ScheduleItem {
  id: string
  title: string
  description: string
  start_time: string
  end_time: string | null
  category: string
  location: string | null
  crew_needed: string[]
  equipment_needed: string[]
  notes: string | null
  sequence_order: number
  is_milestone: boolean
}

interface ScheduleTemplate {
  id: string
  name: string
  description: string
  template_data: any[]
}

export default function ScheduleBuilder() {
  const params = useParams()
  const router = useRouter()
  const [production, setProduction] = useState<Production | null>(null)
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([])
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([])
  const [loading, setLoading] = useState(true)

  // New item form
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    category: 'general',
    location: '',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [params.id])

  const loadData = async () => {
    // Load production
    const { data: productionData, error: prodError } = await supabase
      .from('productions')
      .select('*')
      .eq('id', params.id)
      .single()

    if (prodError) {
      console.error('Error loading production:', prodError)
    } else {
      setProduction(productionData)
    }

    // Load schedule items
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('schedule_items')
      .select('*')
      .eq('production_id', params.id)
      .order('start_time', { ascending: true })

    if (scheduleError) {
      console.error('Error loading schedule:', scheduleError)
    } else {
      setScheduleItems(scheduleData || [])
    }

    // Load templates
    const { data: templatesData, error: templatesError } = await supabase
      .from('schedule_templates')
      .select('*')
      .eq('is_public', true)

    if (templatesError) {
      console.error('Error loading templates:', templatesError)
    } else {
      setTemplates(templatesData || [])
    }

    setLoading(false)
  }

  const addScheduleItem = async () => {
    if (!newItem.title.trim() || !newItem.start_time) return

    const { data, error } = await supabase
      .from('schedule_items')
      .insert([{
        production_id: params.id,
        title: newItem.title.trim(),
        description: newItem.description.trim(),
        start_time: newItem.start_time,
        end_time: newItem.end_time || null,
        category: newItem.category,
        location: newItem.location.trim() || null,
        notes: newItem.notes.trim() || null,
        sequence_order: scheduleItems.length
      }])
      .select()

    if (error) {
      console.error('Error adding schedule item:', error)
    } else {
      setScheduleItems([...scheduleItems, ...data])
      setNewItem({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        category: 'general',
        location: '',
        notes: ''
      })
      setShowAddForm(false)
    }
  }

  const deleteScheduleItem = async (itemId: string) => {
    const { error } = await supabase
      .from('schedule_items')
      .delete()
      .eq('id', itemId)

    if (error) {
      console.error('Error deleting schedule item:', error)
    } else {
      setScheduleItems(scheduleItems.filter(item => item.id !== itemId))
    }
  }

  const applyTemplate = async (templateData: any[]) => {
    // Clear existing schedule
    if (scheduleItems.length > 0) {
      if (!confirm('This will replace your current schedule. Continue?')) return
      
      await supabase
        .from('schedule_items')
        .delete()
        .eq('production_id', params.id)
    }

    // Add template items
    const itemsToInsert = templateData.map((item, index) => ({
      production_id: params.id,
      title: item.title,
      description: item.description || '',
      start_time: item.start_time,
      end_time: item.end_time || null,
      category: item.category || 'general',
      location: item.location || null,
      notes: item.notes || null,
      sequence_order: index
    }))

    const { data, error } = await supabase
      .from('schedule_items')
      .insert(itemsToInsert)
      .select()

    if (error) {
      console.error('Error applying template:', error)
    } else {
      setScheduleItems(data || [])
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'setup': return 'bg-blue-100 text-blue-800'
      case 'shoot': return 'bg-green-100 text-green-800'
      case 'break': return 'bg-yellow-100 text-yellow-800'
      case 'prep': return 'bg-purple-100 text-purple-800'
      case 'wrap': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const calculateDuration = (startTime: string, endTime: string | null) => {
    if (!endTime) return ''
    
    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(`2000-01-01T${endTime}`)
    const diffMs = end.getTime() - start.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    
    if (diffHours < 1) {
      const diffMinutes = Math.round(diffMs / (1000 * 60))
      return `${diffMinutes}min`
    } else {
      return `${diffHours.toFixed(1)}h`
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
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
            <h1 className="text-3xl font-bold">{production?.name} - Schedule</h1>
            <p className="text-gray-600">Build your shoot day timeline</p>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {scheduleItems.length} Items
            </Badge>
            {production?.shoot_date && (
              <p className="text-sm text-gray-500 mt-1">
                {new Date(production.shoot_date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Templates & Controls */}
          <div className="space-y-6">
            {/* Schedule Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Start Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {templates.map((template) => (
                  <div key={template.id} className="p-3 border rounded-lg">
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-gray-600 mb-2">{template.description}</div>
                    <Button 
                      size="sm"
                      onClick={() => applyTemplate(template.template_data)}
                      className="w-full"
                    >
                      Apply Template
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Add New Item */}
            <Card>
              <CardHeader>
                <CardTitle>Add Schedule Item</CardTitle>
              </CardHeader>
              <CardContent>
                {!showAddForm ? (
                  <Button onClick={() => setShowAddForm(true)} className="w-full">
                    + Add Item
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Input
                      placeholder="Item title (e.g., 'Hair & Makeup')"
                      value={newItem.title}
                      onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                    />
                    <Input
                      placeholder="Description"
                      value={newItem.description}
                      onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600">Start Time</label>
                        <Input
                          type="time"
                          value={newItem.start_time}
                          onChange={(e) => setNewItem({...newItem, start_time: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">End Time</label>
                        <Input
                          type="time"
                          value={newItem.end_time}
                          onChange={(e) => setNewItem({...newItem, end_time: e.target.value})}
                        />
                      </div>
                    </div>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={newItem.category}
                      onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    >
                      <option value="setup">Setup</option>
                      <option value="prep">Prep</option>
                      <option value="shoot">Shoot</option>
                      <option value="break">Break</option>
                      <option value="wrap">Wrap</option>
                      <option value="general">General</option>
                    </select>
                    <Input
                      placeholder="Location (optional)"
                      value={newItem.location}
                      onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                    />
                    <div className="flex gap-2">
                      <Button onClick={addScheduleItem} className="flex-1">
                        Add Item
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAddForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Schedule Timeline */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Shoot Day Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {scheduleItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-6xl mb-4">📅</div>
                    <h3 className="text-xl font-semibold mb-2">No schedule items yet</h3>
                    <p>Use a template or add items manually to build your timeline</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {scheduleItems.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        {/* Time Column */}
                        <div className="w-24 text-sm font-mono text-gray-600">
                          <div>{formatTime(item.start_time)}</div>
                          {item.end_time && (
                            <div className="text-gray-400">
                              {formatTime(item.end_time)}
                            </div>
                          )}
                        </div>

                        {/* Timeline Visual */}
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          {index < scheduleItems.length - 1 && (
                            <div className="w-0.5 h-8 bg-gray-200"></div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{item.title}</h4>
                            <Badge className={`text-xs ${getCategoryColor(item.category)}`}>
                              {item.category}
                            </Badge>
                            {item.end_time && (
                              <Badge variant="outline" className="text-xs">
                                {calculateDuration(item.start_time, item.end_time)}
                              </Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                          )}
                          {item.location && (
                            <p className="text-xs text-gray-500">📍 {item.location}</p>
                          )}
                        </div>

                        {/* Actions */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteScheduleItem(item.id)}
                          className="text-red-600 hover:bg-red-100"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Schedule Summary */}
            {scheduleItems.length > 0 && (
              <Card className="mt-6">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {scheduleItems.filter(i => i.category === 'setup').length}
                      </div>
                      <div className="text-sm text-gray-600">Setup Items</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {scheduleItems.filter(i => i.category === 'shoot').length}
                      </div>
                      <div className="text-sm text-gray-600">Shoot Blocks</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">
                        {scheduleItems.filter(i => i.category === 'break').length}
                      </div>
                      <div className="text-sm text-gray-600">Breaks</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {scheduleItems.length}
                      </div>
                      <div className="text-sm text-gray-600">Total Items</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 