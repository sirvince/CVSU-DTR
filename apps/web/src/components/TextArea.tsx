import { forwardRef, type TextareaHTMLAttributes } from 'react'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, error, id, ...textareaProps },
  ref,
) {
  const fieldId = id ?? textareaProps.name
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        {...textareaProps}
        id={fieldId}
        ref={ref}
        aria-invalid={Boolean(error)}
        rows={textareaProps.rows ?? 3}
        className={`rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 ${
          error
            ? 'border-red-400 focus:ring-red-300'
            : 'border-slate-300 focus:ring-sky-300'
        }`}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
})
