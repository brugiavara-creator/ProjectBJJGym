import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  isBlock?: boolean
  variant?: 'primary' | 'accent' | 'secondary'
}

export function Button({ children, className, isBlock = false, type = 'button', variant = 'primary', ...props }: ButtonProps) {
  const classes = ['btn', variant !== 'primary' ? variant : '', isBlock ? 'block' : '', className ?? '']
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} type={type} {...props}>
      {children}
    </button>
  )
}
