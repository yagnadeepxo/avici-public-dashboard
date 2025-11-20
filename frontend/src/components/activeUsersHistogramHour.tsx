"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
	ResponsiveContainer,
	ComposedChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
} from "recharts"
import { useActiveUserDynamic } from "@/hooks/useActiveUsersDynamic"

export function ActiveUsersHour() {
	const { data, loading, error } = useActiveUserDynamic("1h", 1)

	// Custom tooltip: single "Active Users" row, all-black text, note in-progress hour
	const CustomTooltip = ({ active, payload, label }: any) => {
		if (!active || !payload || payload.length === 0) return null
		const first = payload[0]
		const value = first?.value ?? 0
		const isIncomplete = first?.payload?.isIncomplete && value === 0
		const point = first?.payload
		let timeLabel = `${label}:00 UTC`
		if (point?.timestamp) {
			const date = new Date(point.timestamp)
			const hour = date.getUTCHours()
			const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
			const day = date.getUTCDate()
			timeLabel = `${hour}:00 UTC (${month} ${day})`
		}
		return (
			<div
				style={{
					backgroundColor: "white",
					border: "1px solid #e5e7eb",
					borderRadius: 6,
					padding: "6px 8px",
					color: "#000",
					fontSize: 12,
				}}
			>
				<div style={{ color: "#000", marginBottom: 2 }}>{timeLabel}</div>
				<div style={{ color: "#000" }}>
					Active Users: {value}
					{isIncomplete ? " (in progress)" : ""}
				</div>
			</div>
		)
	}

	if (loading) {
		return (
			<Card className="border border-border bg-background">
				<CardContent className="p-6 text-center text-sm text-muted-foreground">
					Loading active user data...
				</CardContent>
			</Card>
		)
	}

	if (error) {
		return (
			<Card className="border border-border bg-background">
				<CardContent className="p-6 text-center text-sm text-red-500">
					Error: {error}
				</CardContent>
			</Card>
		)
	}

	// Get rolling 24-hour window: sort and take latest 24 data points
	const raw = Array.isArray(data?.graphData) ? data!.graphData : []
	const currentUtcHour = new Date().getUTCHours()
	
	// Sort by periodStart to ensure chronological order (oldest first)
	const sortedData = [...raw].sort((a: any, b: any) => {
		const dateA = new Date(a?.periodStart || a?.timestamp || 0).getTime()
		const dateB = new Date(b?.periodStart || b?.timestamp || 0).getTime()
		return dateA - dateB
	})
	
	// Take only the latest 24 data points (rolling 24-hour window)
	const latest24 = sortedData.slice(-24)
	
	// Map to series format with index, hour, and activeUsers
	const series = latest24.map((pt: any, idx: number) => {
		const timestamp = pt?.periodStart || pt?.timestamp
		const date = timestamp ? new Date(timestamp) : new Date()
		const hour = date.getUTCHours()
		const value = (pt?.activeUsers ?? 0) as number
		const isIncomplete = hour === currentUtcHour && value === 0
		return { 
			hour, 
			activeUsers: value, 
			isIncomplete,
			index: idx,
			timestamp
		}
	})

	return (
		<Card className="border border-border bg-background">
			<CardContent className="p-4">
				<p className="text-sm text-muted-foreground mb-2">
					Active Users by Hour (Last 24 Hours)
				</p>
				<div className="w-full h-[300px]">
					<ResponsiveContainer width="100%" height="100%">
						<ComposedChart data={series}>
							<CartesianGrid
								strokeDasharray="3 3"
								stroke="rgba(0,0,0,0.05)"
								vertical={false}
							/>
							<XAxis
								dataKey="index"
								tickLine={false}
								axisLine={false}
								tick={{ fill: "#888", fontSize: 12 }}
								tickFormatter={(value, index) => {
									const point = series[index]
									return point ? `${point.hour}` : `${value}`
								}}
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								tick={{ fill: "#888", fontSize: 12 }}
							/>
							<Tooltip
								cursor={{ fill: "rgba(0,0,0,0.05)" }}
								content={<CustomTooltip />}
							/>
							<Bar
								dataKey="activeUsers"
								barSize={20}
								fill="rgba(0, 0, 0, 0.4)"
								radius={[4, 4, 0, 0]}
							/>
						</ComposedChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	)
}


