import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MultiSelectProps {
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  label?: string
  className?: string
  error?: string
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select options...',
  label,
  className,
  error,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter(v => v !== option))
    } else {
      onChange([...value, option])
    }
  }

  const removeOption = (option: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter(v => v !== option))
  }

  return (
    <div className={cn('space-y-2', className)} ref={containerRef}>
      {label && <Label>{label}</Label>}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          className={cn(
            'w-full justify-between text-left font-normal',
            !value.length && 'text-muted-foreground',
            error && 'border-destructive'
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="flex flex-wrap gap-1 flex-1">
            {value.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              value.map(option => (
                <span
                  key={option}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary text-sm"
                >
                  {option}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-destructive"
                    onClick={(e) => removeOption(option, e)}
                  />
                </span>
              ))
            )}
          </span>
          <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform', isOpen && 'rotate-180')} />
        </Button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
            <div className="p-2 border-b">
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="p-1">
              {filteredOptions.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">No options found</div>
              ) : (
                filteredOptions.map(option => (
                  <div
                    key={option}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm',
                      value.includes(option) && 'bg-accent'
                    )}
                    onClick={() => toggleOption(option)}
                  >
                    <div className={cn(
                      'flex h-4 w-4 items-center justify-center rounded border',
                      value.includes(option) && 'bg-primary border-primary'
                    )}>
                      {value.includes(option) && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className="text-sm">{option}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

