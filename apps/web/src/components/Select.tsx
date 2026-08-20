import { forwardRef, type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, id, children, ...selectProps },
  ref,
) {
  const fieldId = id ?? selectProps.name
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        {...selectProps}
        id={fieldId}
        ref={ref}
        aria-invalid={Boolean(error)}
        className={`rounded-md border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 ${
          error
            ? 'border-red-400 focus:ring-red-300'
            : 'border-slate-300 focus:ring-sky-300'
        }`}
      >
        {children}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
})
