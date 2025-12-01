"use client"

import { useState, FormEvent, ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const PASSCODE = "6969"
const STORAGE_KEY = "dashboard_passcode_validated"

interface PasscodeGateProps {
  onSuccess: () => void
}

export function PasscodeGate({ onSuccess }: PasscodeGateProps) {
  const [passcode, setPasscode] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow numeric input and limit to 4 digits
    if (value === "" || (/^\d+$/.test(value) && value.length <= 4)) {
      setPasscode(value)
      setError(null) // Clear error when user types
    }
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (passcode === PASSCODE) {
      // Store validation in localStorage
      localStorage.setItem(STORAGE_KEY, "true")
      setError(null)
      onSuccess()
    } else {
      setError("Incorrect passcode. Please try again.")
      setPasscode("")
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
    >
      <Card className="w-full max-w-md border border-border bg-card shadow-xl">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle 
            className="text-lg sm:text-xl font-semibold text-center break-words"
            style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
          >
            Enter Passcode
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={passcode}
                onChange={handleInputChange}
                placeholder="Enter 4-digit passcode"
                className="w-full px-3 sm:px-4 py-3 text-center text-xl sm:text-2xl tracking-widest border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
                maxLength={4}
                autoFocus
              />
            </div>
            {error && (
              <p 
                className="text-xs sm:text-sm text-red-500 text-center break-words px-2"
                style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={passcode.length !== 4}
              style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
            >
              Submit
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

