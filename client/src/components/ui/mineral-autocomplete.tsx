"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useGetAllMineralsQuery } from "@/state/api"

interface MineralAutocompleteProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function MineralAutocomplete({
  value,
  onValueChange,
  placeholder = "Select mineral...",
  className,
  disabled = false,
}: MineralAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const { data: mineralsResponse, isLoading } = useGetAllMineralsQuery({ search })
  const minerals = mineralsResponse?.data || []

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {value || placeholder}
          {isLoading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search minerals..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Loading minerals..." : "No mineral found."}
            </CommandEmpty>
            <CommandGroup>
              {minerals.map((mineral) => (
                <CommandItem
                  key={mineral}
                  value={mineral}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === mineral ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {mineral}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
