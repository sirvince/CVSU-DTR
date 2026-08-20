import { forwardRef, type InputHTMLAttributes } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, id, ...inputProps },
  ref,
) {
  const fieldId = id ?? inputProps.name
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        {...inputProps}
        id={fieldId}
        ref={ref}
        aria-invalid={Boolean(error)}
        className={`rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 ${
          error
            ? 'border-red-400 focus:ring-red-300'
            : 'border-slate-300 focus:ring-sky-300'
        }`}
      />
      {!error && hint && <p className="text-sm text-slate-400">{hint}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
})
