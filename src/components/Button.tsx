import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import './Button.css'

export type ButtonVariant = 'solid' | 'outline' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  active?: boolean
}

/**
 * Reusable button component with simple variants.
 */
export const Button = ({
  variant = 'solid',
  active = false,
  type = 'button',
  className = '',
  children,
  ...rest
}: PropsWithChildren<ButtonProps>) => {
  const classes = ['app-button', `app-button--${variant}`]

  if (active) {
    classes.push('app-button--active')
  }

  if (className) {
    classes.push(className)
  }

  return (
    <button type={type} className={classes.join(' ')} {...rest}>
      {children}
    </button>
  )
}
