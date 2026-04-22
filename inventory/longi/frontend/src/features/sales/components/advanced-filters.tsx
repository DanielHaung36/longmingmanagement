"use client"

import type React from "react"

import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Search, Download, Calendar, Filter, BarChart3 } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion"

interface AdvancedFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusChange: (value: string) => void
  dateRange: { start: string; end: string }
  onDateRangeChange: (range: { start: string; end: string }) => void
  selectedItem: string
  onItemChange: (value: string) => void
  allItems: string[]
  onExport: () => void
  onExportAggregated: () => void
  onShowItemAnalysis: () => void
  children?: React.ReactNode
}

export function AdvancedFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateRange,
  onDateRangeChange,
  selectedItem,
  onItemChange,
  allItems,
  onExport,
  onExportAggregated,
  onShowItemAnalysis,
  children,
}: AdvancedFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Advanced Filters & Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible defaultValue="basic">
          <AccordionItem value="basic">
            <AccordionTrigger>Basic Filters</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <Label htmlFor="search">Search Orders</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by ID, product, customer, project..."
                      value={searchTerm}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status">Geographical Filter</Label>
                  <Select value={statusFilter} onValueChange={onStatusChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="AU">Domestic (AU)</SelectItem>
                      <SelectItem value="INT">International</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="advanced">
            <AccordionTrigger>Advanced Filters</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="startDate"
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="endDate"
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="itemFilter">Item Filter</Label>
                  <Select value={selectedItem} onValueChange={onItemChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by specific item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      {allItems.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t mt-4">
          <Button onClick={onExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Filtered Data
          </Button>
          <Button onClick={onExportAggregated} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Aggregated Report
          </Button>
          <Button onClick={onShowItemAnalysis} variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Item Analysis
          </Button>
          <Button
            onClick={() => {
              onSearchChange("")
              onStatusChange("all")
              onDateRangeChange({ start: "", end: "" })
              onItemChange("all")
            }}
            variant="ghost"
          >
            Clear All Filters
          </Button>
          {children}
        </div>
      </CardContent>
    </Card>
  )
}
