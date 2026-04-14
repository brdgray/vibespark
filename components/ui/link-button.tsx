import Link from 'next/link'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import type { VariantProps } from 'class-variance-authority'

export type LinkButtonProps = ComponentProps<typeof Link> &
  VariantProps<typeof buttonVariants>

export function LinkButton({
  className,
  variant,
  size,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </Link>
  )
}
