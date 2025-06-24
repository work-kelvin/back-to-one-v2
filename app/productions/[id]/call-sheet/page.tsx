'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface Production {
  id: string
  name: string
  shoot_date: string | null
  call_time: string | null
  location_address: string | null
  location_details: string | null
  client_name: string | null
  producer_name: string | null
  producer_phone: string | null
  weather_backup: string | null
  parking_info: string | null
  special_notes: string | null
  created_at: string
}

interface CrewMember {
  id: string
  name: string
  role: string
  call_time: string | null
  phone: string | null
  email: string | null
  notes: string | null
}

interface Look {
  id: string
  name: string
  sequence_order: number
}

export default function CallSheetGenerator() {
  const params = useParams()
  const router = useRouter()
  const [production, setProduction] = useState<Production | null>(null)
  const [crew, setCrew] = useState<CrewMember[]>([])
  const [looks, setLooks] = useState<Look[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const callSheetRef = useRef<HTMLDivElement>(null)

  // New crew member form
  const [newCrew, setNewCrew] = useState({
    name: '',
    role: '',
    call_time: '',
    phone: '',
    email: ''
  })

  useEffect(() => {
    // Inline loadData to avoid missing dependency warning
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

      // Load crew
      const { data: crewData, error: crewError } = await supabase
        .from('crew_members')
        .select('*')
        .eq('production_id', params.id)
        .order('role', { ascending: true })

      if (crewError) {
        console.error('Error loading crew:', crewError)
      } else {
        setCrew(crewData || [])
      }

      // Load looks
      const { data: looksData, error: looksError } = await supabase
        .from('looks')
        .select('id, name, sequence_order')
        .eq('production_id', params.id)
        .order('sequence_order', { ascending: true })

      if (looksError) {
        console.error('Error loading looks:', looksError)
      } else {
        setLooks(looksData || [])
      }

      setLoading(false)
    }
    loadData()
  }, [params.id])

  const updateProduction = async (field: string, value: string) => {
    const { error } = await supabase
      .from('productions')
      .update({ [field]: value })
      .eq('id', params.id)

    if (error) {
      console.error('Error updating production:', error)
    } else {
      setProduction(prev => prev ? { ...prev, [field]: value } : null)
    }
  }

  const addCrewMember = async () => {
    if (!newCrew.name.trim() || !newCrew.role.trim()) return

    const { data, error } = await supabase
      .from('crew_members')
      .insert([{
        production_id: params.id,
        ...newCrew
      }])
      .select()

    if (error) {
      console.error('Error adding crew member:', error)
    } else {
      setCrew([...crew, ...data])
      setNewCrew({ name: '', role: '', call_time: '', phone: '', email: '' })
    }
  }

  const removeCrewMember = async (crewId: string) => {
    const { error } = await supabase
      .from('crew_members')
      .delete()
      .eq('id', crewId)

    if (error) {
      console.error('Error removing crew member:', error)
    } else {
      setCrew(crew.filter(c => c.id !== crewId))
    }
  }

  const generatePDF = async () => {
    if (!callSheetRef.current || !production) return

    setGenerating(true)
    
    try {
      const canvas = await html2canvas(callSheetRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      } as any)

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`${production.name} - Call Sheet.pdf`)
      console.log('✅ PDF generated successfully')
    } catch (error) {
      console.error('❌ Error generating PDF:', error)
      alert('Failed to generate PDF')
    }

    setGenerating(false)
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
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
            <h1 className="text-3xl font-bold">{production.name} - Call Sheet</h1>
            <p className="text-gray-600">Generate professional call sheets</p>
          </div>
          <Button 
            onClick={generatePDF}
            disabled={generating}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {generating ? 'Generating...' : '📄 Generate PDF'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Production Details Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Production Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Client Name</label>
                  <Input
                    placeholder="Client/Brand name"
                    value={production.client_name || ''}
                    onChange={(e) => updateProduction('client_name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Producer Name</label>
                  <Input
                    placeholder="Your name"
                    value={production.producer_name || ''}
                    onChange={(e) => updateProduction('producer_name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Producer Phone</label>
                  <Input
                    placeholder="Your phone number"
                    value={production.producer_phone || ''}
                    onChange={(e) => updateProduction('producer_phone', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Shoot Date</label>
                  <Input
                    type="date"
                    value={production.shoot_date || ''}
                    onChange={(e) => updateProduction('shoot_date', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">General Call Time</label>
                  <Input
                    type="time"
                    value={production.call_time || ''}
                    onChange={(e) => updateProduction('call_time', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <Input
                    placeholder="Street address"
                    value={production.location_address || ''}
                    onChange={(e) => updateProduction('location_address', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location Details</label>
                  <Input
                    placeholder="Building name, studio details, etc."
                    value={production.location_details || ''}
                    onChange={(e) => updateProduction('location_details', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Parking Info</label>
                  <Input
                    placeholder="Parking instructions"
                    value={production.parking_info || ''}
                    onChange={(e) => updateProduction('parking_info', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Weather Backup</label>
                  <Input
                    placeholder="Indoor location if outdoor shoot"
                    value={production.weather_backup || ''}
                    onChange={(e) => updateProduction('weather_backup', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add Crew Member</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Input
                    placeholder="Name"
                    value={newCrew.name}
                    onChange={(e) => setNewCrew({...newCrew, name: e.target.value})}
                  />
                  <Input
                    placeholder="Role (Photographer, Model, etc.)"
                    value={newCrew.role}
                    onChange={(e) => setNewCrew({...newCrew, role: e.target.value})}
                  />
                  <Input
                    type="time"
                    placeholder="Call time"
                    value={newCrew.call_time}
                    onChange={(e) => setNewCrew({...newCrew, call_time: e.target.value})}
                  />
                  <Input
                    placeholder="Phone"
                    value={newCrew.phone}
                    onChange={(e) => setNewCrew({...newCrew, phone: e.target.value})}
                  />
                </div>
                <Button onClick={addCrewMember} className="w-full">
                  Add to Crew
                </Button>
              </CardContent>
            </Card>

            {/* Crew List */}
            {crew.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Crew Members ({crew.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {crew.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-gray-600">
                            {member.role} • {member.call_time || 'No call time'} • {member.phone || 'No phone'}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCrewMember(member.id)}
                          className="text-red-600 hover:bg-red-100"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Call Sheet Preview */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Call Sheet Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  ref={callSheetRef}
                  className="bg-white p-6 border shadow-sm"
                  style={{ fontFamily: 'Arial, sans-serif' }}
                >
                  {/* Call Sheet Header */}
                  <div className="text-center border-b-2 border-black pb-4 mb-6">
                    <h1 className="text-2xl font-bold mb-2">CALL SHEET</h1>
                    <h2 className="text-xl font-semibold">{production.name}</h2>
                    {production.client_name && (
                      <p className="text-lg">Client: {production.client_name}</p>
                    )}
                  </div>

                  {/* Production Info */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <strong>Date:</strong> {production.shoot_date ? new Date(production.shoot_date).toLocaleDateString() : 'TBD'}
                    </div>
                    <div>
                      <strong>Call Time:</strong> {production.call_time || 'TBD'}
                    </div>
                    <div>
                      <strong>Producer:</strong> {production.producer_name || 'TBD'}
                    </div>
                    <div>
                      <strong>Phone:</strong> {production.producer_phone || 'TBD'}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="mb-6">
                    <h3 className="font-bold text-lg border-b border-gray-300 pb-1 mb-2">LOCATION</h3>
                    <p><strong>Address:</strong> {production.location_address || 'TBD'}</p>
                    {production.location_details && <p><strong>Details:</strong> {production.location_details}</p>}
                    {production.parking_info && <p><strong>Parking:</strong> {production.parking_info}</p>}
                    {production.weather_backup && <p><strong>Weather Backup:</strong> {production.weather_backup}</p>}
                  </div>

                  {/* Crew */}
                  {crew.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-bold text-lg border-b border-gray-300 pb-1 mb-2">CREW</h3>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="text-left p-2 border">Name</th>
                            <th className="text-left p-2 border">Role</th>
                            <th className="text-left p-2 border">Call Time</th>
                            <th className="text-left p-2 border">Phone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {crew.map((member) => (
                            <tr key={member.id}>
                              <td className="p-2 border">{member.name}</td>
                              <td className="p-2 border">{member.role}</td>
                              <td className="p-2 border">{member.call_time || '-'}</td>
                              <td className="p-2 border">{member.phone || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Looks */}
                  {looks.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-bold text-lg border-b border-gray-300 pb-1 mb-2">LOOKS</h3>
                      <ol className="list-decimal list-inside space-y-1">
                        {looks.map((look, index) => (
                          <li key={look.id}>Look {index + 1}: {look.name}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Emergency Info */}
                  <div className="border-t-2 border-black pt-4 mt-6">
                    <h3 className="font-bold text-lg mb-2">EMERGENCY CONTACTS</h3>
                    <p><strong>Producer:</strong> {production.producer_name || 'TBD'} - {production.producer_phone || 'TBD'}</p>
                    <p><strong>Emergency Services:</strong> 911</p>
                  </div>

                  {/* Special Notes */}
                  {production.special_notes && (
                    <div className="mt-4">
                      <h3 className="font-bold text-lg mb-2">SPECIAL NOTES</h3>
                      <p>{production.special_notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 