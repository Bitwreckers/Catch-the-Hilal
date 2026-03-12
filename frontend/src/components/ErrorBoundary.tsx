import type { ReactNode } from 'react'
import { Component } from 'react'

interface Props {
  children: ReactNode
  fallback: ReactNode
  onError?: () => void
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch() {
    this.props.onError?.()
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}
