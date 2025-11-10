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
								formatter={(value: number, _name: any, props: any) => {
									const payload = props?.payload as { isIncomplete?: boolean } | undefined
									const suffix = payload?.isIncomplete && value === 0 ? " (in progress)" : ""
									return [value, `Active Users${suffix}`]
								}}
								labelFormatter={(label) => `${label}:00 UTC`}
								contentStyle={{
									backgroundColor: "grey",
									border: "1px solid #374151",
									borderRadius: "6px",
									fontSize: "12px",
								}}
							/>
							<Bar dataKey="activeUsers" barSize={18} fill="black" radius={[4, 4, 0, 0]} />
						</ComposedChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	)
}


