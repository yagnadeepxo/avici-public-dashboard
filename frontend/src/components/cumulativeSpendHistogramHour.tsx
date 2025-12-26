"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
	ResponsiveContainer,
	ComposedChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
} from "recharts"
import { useHistogramData } from "@/hooks/useHistogramData"

export function CumulativeSpendHour() {
	const { data, loading, error } = useHistogramData()

	if (loading) {
		return (
			<Card className="border border-border bg-background">
				<CardContent className="p-6 text-center text-sm text-muted-foreground">
					Loading cumulative spend data...
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

	let running = 0
	const cumulativeSeries = (data || []).map((d) => {
		running += d.spend
		return { 
			day: d.day, 
			cumulativeSpend: running,
			index: d.index,
			timestamp: d.timestamp
		}
	})

	return (
		<Card className="border border-border bg-background">
			<CardContent className="p-4">
				<p className="text-sm text-muted-foreground mb-2">
					Cumulative Spend (Last 24 Days)
				</p>
				<div className="w-full h-[300px]">
					<ResponsiveContainer width="100%" height="100%">
						<ComposedChart data={cumulativeSeries}>
							<CartesianGrid
								strokeDasharray="3 3"
								stroke="rgba(0,0,0,0.05)"
								vertical={false}
							/>
							<XAxis
								dataKey="day"
								tickLine={false}
								axisLine={false}
								tick={{ fill: "#888", fontSize: 12 }}
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								tick={{ fill: "#888", fontSize: 12 }}
								tickFormatter={(val) => `$${Number(val).toLocaleString('en-US')}`}
							/>
							<Tooltip
								cursor={{ fill: "rgba(0,0,0,0.05)" }}
								formatter={(value: number) => [
									`$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
									"Cumulative Spend",
								]}
								labelFormatter={(label, payload) => {
									const point = payload?.[0]?.payload
									if (point?.timestamp) {
										const date = new Date(point.timestamp)
										return date.toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
											year: "numeric",
										})
									}
									return point?.day || label
								}}
							/>
							<Line type="monotone" dataKey="cumulativeSpend" stroke="#000" strokeWidth={1.8} dot={false} />
						</ComposedChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	)
}


