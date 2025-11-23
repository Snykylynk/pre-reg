import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComboboxProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  className?: string
  error?: string
  required?: boolean
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  label,
  className,
  error,
  required,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedOption = value ? options.find(opt => opt.toLowerCase() === value.toLowerCase()) ?? value : ''

  const handleSelect = (option: string) => {
    onChange(option)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    if (!isOpen) {
      setIsOpen(true)
    }
    // If user types a value that matches an option, select it
    const matchingOption = options.find(opt => opt.toLowerCase() === newValue.toLowerCase())
    if (matchingOption && newValue.length > 0) {
      // Don't auto-select, let user click or press enter
    }
  }

  const handleInputFocus = () => {
    setIsOpen(true)
    setSearchTerm('')
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredOptions.length > 0) {
      e.preventDefault()
      handleSelect(filteredOptions[0])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchTerm('')
    }
  }

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setSearchTerm('')
  }

  return (
    <div className={cn('space-y-2', className)} ref={containerRef}>
      {label && <Label>{label}{required && ' *'}</Label>}
      <div className="relative">
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            value={isOpen ? searchTerm : (selectedOption || '')}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder={placeholder}
            className={cn(
              'pr-8',
              error && 'border-destructive'
            )}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {value && (
              <X
                className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={clearSelection}
              />
            )}
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No options found</div>
            ) : (
              <div className="p-1">
                {filteredOptions.map(option => (
                  <div
                    key={option}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm',
                      value === option && 'bg-accent'
                    )}
                    onClick={() => handleSelect(option)}
                  >
                    <div className={cn(
                      'flex h-4 w-4 items-center justify-center rounded border shrink-0',
                      value === option && 'bg-primary border-primary'
                    )}>
                      {value === option && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className="text-sm">{option}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

