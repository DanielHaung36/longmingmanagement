'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Users } from 'lucide-react'

export default function TeamsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users className="h-8 w-8 text-emerald-600" />
          Teams Management
        </h1>
        <p className="text-gray-600 mt-2">Organize users into teams</p>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Teams feature coming soon!</p>
          <p className="text-gray-400 text-sm mt-2">Create and manage teams to organize your workforce</p>
        </CardContent>
      </Card>
    </div>
  )
}
