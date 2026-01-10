"use client"

import { useState, useEffect } from "react"
import { PasscodeGate } from "@/components/PasscodeGate"
import { CardsContent } from "@/components/cardsContent"
import VirtualAccountsPage from "@/app/virtual-accounts/page"
import VolumePage from "@/app/volume/page"
import { type TimePeriod } from "@/hooks/useCardShare"

const STORAGE_KEY = "dashboard_passcode_validated"

type TabType = "cards" | "accounts" | "total volume"

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("cards")
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all")
  const [isPasscodeValidated, setIsPasscodeValidated] = useState<boolean | null>(null)

  // Check localStorage on mount
  useEffect(() => {
    const validated = localStorage.getItem(STORAGE_KEY) === "true"
    setIsPasscodeValidated(validated)
  }, [])

  const handlePasscodeSuccess = () => {
    setIsPasscodeValidated(true)
  }

  // Show loading state while checking localStorage
  if (isPasscodeValidated === null) {
    return null
  }

  // Show passcode gate if not validated
  if (!isPasscodeValidated) {
    return <PasscodeGate onSuccess={handlePasscodeSuccess} />
  }

  // Render dashboard immediately - let React Query hooks handle data fetching
  return (
    <div 
      className="min-h-screen bg-background"
      style={{ fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif' }}
    >
      {/* Main Navigation Bar - Tabs */}
      <div className="border-b border-border bg-background sticky top-0 z-10">
        <div className="px-4 md:px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center">
              <div className="inline-flex border border-border rounded-lg bg-muted/30 p-1 gap-1">
                {(["cards", "accounts", "total volume"] as const).map((tab) => {
                  const displayText = tab === "accounts" ? "Accounts" : tab === "cards" ? "Cards" : "Total Volume";
                  const isActive = activeTab === tab;
                  
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`
                        px-6 py-2.5 font-semibold text-sm rounded-md
                        transition-all duration-200
                        ${
                          isActive
                            ? "bg-background text-foreground shadow-sm border border-border"
                            : "bg-transparent text-muted-foreground hover:text-foreground"
                        }
                      `}
                      style={{ 
                        fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif'
                      }}
                    >
                      {displayText}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Period Selector */}
      <div className="px-4 md:px-6 pt-3 pb-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-1.5 items-center justify-center">
            {(["24h", "7d", "30d", "all"] as const).map((period) => {
              const displayText = period === "24h" ? "24 H" : period === "7d" ? "7D" : period === "30d" ? "30 D" : "ALL";
              const isActive = timePeriod === period;
              
              return (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`
                    px-2.5 py-1 font-medium text-xs rounded
                    transition-all duration-200
                    ${
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-transparent text-muted-foreground hover:bg-muted/50 border border-transparent"
                    }
                  `}
                  style={{ 
                    fontFamily: '"SF Pro Rounded", system-ui, -apple-system, sans-serif'
                  }}
                >
                  {displayText}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content based on active tab - React Query hooks handle data fetching */}
      {activeTab === "cards" && <CardsContent timePeriod={timePeriod} />}
      {activeTab === "accounts" && <VirtualAccountsPage timePeriod={timePeriod} />}
      {activeTab === "total volume" && <VolumePage timePeriod={timePeriod} />}
    </div>
  )
}