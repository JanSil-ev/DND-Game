import type { PropsWithChildren } from 'react'
import { BrowserRouter } from 'react-router-dom'
import '../styles/globals.scss'

export function AppProviders({ children }: PropsWithChildren) {
  return <BrowserRouter>{children}</BrowserRouter>
}
