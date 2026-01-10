"use client"

interface LoadingIndicatorProps {
  isLoading: boolean
}

export function LoadingIndicator({ isLoading }: LoadingIndicatorProps) {
  if (!isLoading) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex items-center justify-center bg-background/95 backdrop-blur-sm border border-border rounded-full p-2 shadow-lg">
        {/* Spinner */}
        <div className="relative w-4 h-4">
          <div className="absolute inset-0 border-2 border-muted-foreground/20 rounded-full"></div>
          <div 
            className="absolute inset-0 border-2 border-foreground border-t-transparent rounded-full animate-spin"
            style={{ animationDuration: '0.8s' }}
          ></div>
        </div>
      </div>
    </div>
  )
}

