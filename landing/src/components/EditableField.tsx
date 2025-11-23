import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/components/MultiSelect'
import { Combobox } from '@/components/Combobox'
import { Pencil, Check, X } from 'lucide-react'

interface EditableFieldProps {
  label: string
  value: string | number | string[] | undefined | null
  type?: 'text' | 'email' | 'tel' | 'date' | 'number' | 'select' | 'textarea' | 'multiselect'
  options?: string[] | { value: string; label: string }[]
  placeholder?: string
  onSave: (value: any) => Promise<void>
  formatValue?: (value: any) => string
  rows?: number
}

export function EditableField({
  label,
  value,
  type = 'text',
  options,
  placeholder,
  onSave,
  formatValue,
  rows = 4,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(() => {
    if (type === 'multiselect') {
      return Array.isArray(value) ? value : []
    }
    return value ?? ''
  })
  const [saving, setSaving] = useState(false)

  const handleEdit = () => {
    if (type === 'multiselect') {
      setEditValue(Array.isArray(value) ? value : [])
    } else {
      setEditValue(value ?? '')
    }
    setIsEditing(true)
  }

  const handleCancel = () => {
    if (type === 'multiselect') {
      setEditValue(Array.isArray(value) ? value : [])
    } else {
      setEditValue(value ?? '')
    }
    setIsEditing(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      let finalValue: any = editValue
      
      if (type === 'number') {
        finalValue = editValue ? parseFloat(editValue as string) : null
      } else if (type === 'date') {
        finalValue = editValue || null
      } else if (type === 'multiselect') {
        finalValue = Array.isArray(editValue) ? editValue : []
      }
      
      await onSave(finalValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }

  const getDisplayValue = () => {
    if (formatValue) {
      return formatValue(value)
    }
    if (value === null || value === undefined || value === '') {
      return 'Not set'
    }
    if (type === 'multiselect' && Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'Not set'
    }
    if (type === 'date' && value) {
      const date = new Date(value as string)
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    }
    return String(value)
  }

  const displayValue = getDisplayValue()

  if (isEditing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-muted-foreground">{label}</label>
        </div>
        <div className="flex gap-2">
          {type === 'textarea' ? (
            <Textarea
              value={editValue as string}
              onChange={(e) => setEditValue(e.target.value)}
              rows={rows}
              className="flex-1"
              placeholder={placeholder}
            />
          ) : type === 'multiselect' && Array.isArray(options) ? (
            <div className="flex-1">
              <MultiSelect
                options={options}
                value={Array.isArray(editValue) ? editValue : []}
                onChange={(value) => setEditValue(value)}
                placeholder={placeholder}
              />
            </div>
          ) : type === 'select' && options && Array.isArray(options) && typeof options[0] === 'string' ? (
            <div className="flex-1">
              <Combobox
                options={options as string[]}
                value={editValue as string}
                onChange={(value) => setEditValue(value)}
                placeholder={placeholder}
              />
            </div>
          ) : type === 'select' && options ? (
            <Select
              value={editValue as string}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1"
            >
              {(options as { value: string; label: string }[]).map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          ) : (
            <Input
              type={type}
              value={editValue as string | number}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1"
              placeholder={placeholder}
            />
          )}
          <Button
            size="icon"
            variant="outline"
            onClick={handleSave}
            disabled={saving}
            className="shrink-0"
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
            className="shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start justify-between py-2 border-b last:border-0">
      <div className="flex-1">
        <div className="text-sm font-medium text-muted-foreground mb-1">{label}</div>
        <div className="text-base">{displayValue}</div>
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={handleEdit}
        className="shrink-0 ml-4"
      >
        <Pencil className="w-4 h-4" />
      </Button>
    </div>
  )
}

