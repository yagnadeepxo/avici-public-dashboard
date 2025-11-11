"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
				<div style={{ color: "#000", marginBottom: 2 }}>{label}:00 UTC</div>
				<div style={{ color: "#000" }}>
					Active Users: {value}
					{isIncomplete ? " (in progress)" : ""}
				</div>
			</div>
		)
	}

	if (loading) {
		return (
			<Card className="border border-border bg-card">
				<CardHeader>
					<CardTitle className="text-lg font-semibold">Active Users (UTC)</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-sm">Loading active user data...</p>
				</CardContent>
			</Card>
		)
	}

	if (error) {
		return (
			<Card className="border border-border bg-card">
				<CardHeader>
					<CardTitle className="text-lg font-semibold">Active Users (UTC)</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-red-500 text-sm">Error: {error}</p>
				</CardContent>
			</Card>
		)
	}

	// Build an array for 24 hours, fill with API values or 0 if missing/incomplete
	const currentUtcHour = new Date().getUTCHours()
	const raw = Array.isArray(data?.graphData) ? data!.graphData : []
	const series = Array.from({ length: 24 }, (_, hour) => {
		// find the matching hour point if present
		const match: any = raw.find((pt: any) => {
			const ts = pt?.periodStart || pt?.timestamp
			if (!ts) return false
			return new Date(ts).getUTCHours() === hour
		})
		const value = (match?.activeUsers ?? 0) as number
		const isIncomplete = hour === currentUtcHour
		return { hour, activeUsers: value, isIncomplete }
	})

	return (
		<Card className="border border-border bg-card">
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-sm font-semibold">Active Users by Hour (UTC)</CardTitle>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="w-full h-[280px]">
					<ResponsiveContainer width="100%" height="100%">
						<ComposedChart data={series} margin={{ top: 5, right: 5, left: 0, bottom: 20 }}>
							<CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
							<XAxis
								dataKey="hour"
								label={{ value: "Hour (UTC)", position: "insideBottom", offset: -5, style: { fontSize: 12 } }}
								tick={{ fontSize: 10 }}
								tickLine={{ stroke: "#6b7280" }}
								axisLine={{ stroke: "#6b7280" }}
							/>
							<YAxis
								label={{ value: "active users", angle: -90, position: "insideLeft", style: { fontSize: 12 } }}
								tick={{ fontSize: 10 }}
								tickLine={{ stroke: "#6b7280" }}
								axisLine={{ stroke: "#6b7280" }}
								width={45}
							/>
							<Tooltip
								cursor={{ fill: "rgba(0,0,0,0.05)" }}
								content={<CustomTooltip />}
								wrapperStyle={{ color: "#000" }}
								labelStyle={{ color: "#000" }}
								itemStyle={{ color: "#000" }}
							/>
							<Bar dataKey="activeUsers" barSize={18} fill="rgba(0, 0, 0, 0.08)" radius={[4, 4, 0, 0]} />
						</ComposedChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	)
}


