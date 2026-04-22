"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { useState } from "react"

interface AdvancedPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
  className?: string
}

export function AdvancedPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  className,
}: AdvancedPaginationProps) {
  const [jumpToPage, setJumpToPage] = useState("")

  const handleJumpToPage = () => {
    const page = Number.parseInt(jumpToPage)
    if (page >= 1 && page <= totalPages) {
      onPageChange(page)
      setJumpToPage("")
    }
  }

  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...")
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Items per page selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Show</span>
        <Select value={itemsPerPage.toString()} onValueChange={(value) => onItemsPerPageChange(Number(value))}>
          <SelectTrigger className="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">per page</span>
      </div>

      {/* Page info */}
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {totalItems} results
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* First page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getVisiblePages().map((page, index) => (
            <div key={index}>
              {page === "..." ? (
                <span className="px-2 text-muted-foreground">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  className="h-8 w-8 p-0"
                >
                  {page}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Next page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Jump to page */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Go to</span>
        <Input
          type="number"
          min="1"
          max={totalPages}
          value={jumpToPage}
          onChange={(e) => setJumpToPage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleJumpToPage()
            }
          }}
          className="w-16 h-8"
          placeholder="1"
        />
        <Button size="sm" onClick={handleJumpToPage} disabled={!jumpToPage} className="h-8">
          Go
        </Button>
      </div>
    </div>
  )
}
