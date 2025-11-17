"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { formatCurrency } from "@/lib/utils"

export function CumulativeSpendHour() {
	const { data, loading, error } = useHistogramData()

	if (loading) {
		return (
			<Card className="border border-border bg-card">
				<CardHeader>
					<CardTitle className="text-lg font-semibold">Cumulative Spend (UTC)</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-sm">Loading cumulative spend data...</p>
				</CardContent>
			</Card>
		)
	}

	if (error) {
		return (
			<Card className="border border-border bg-card">
				<CardHeader>
					<CardTitle className="text-lg font-semibold">Cumulative Spend (UTC)</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-red-500 text-sm">Error: {error}</p>
				</CardContent>
			</Card>
		)
	}

	let running = 0
	const cumulativeSeries = (data || []).map((d) => {
		running += d.spend
		return { hour: d.hour, cumulativeSpend: running }
	})

	return (
		<Card className="border border-border bg-card">
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-sm font-semibold">Cumulative Spend by Hour (UTC)</CardTitle>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="w-full h-[280px]">
					<ResponsiveContainer width="100%" height="100%">
						<ComposedChart data={cumulativeSeries} margin={{ top: 5, right: 5, left: 0, bottom: 20 }}>
							<CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
							<XAxis
								dataKey="hour"
								label={{ value: "Hour (UTC)", position: "insideBottom", offset: -5, style: { fontSize: 12 } }}
								tick={{ fontSize: 10 }}
								tickLine={{ stroke: "#6b7280" }}
								axisLine={{ stroke: "#6b7280" }}
							/>
							<YAxis
								label={{ value: "cumulative spend", angle: -90, position: "insideLeft", style: { fontSize: 12 } }}
								tick={{ fontSize: 10 }}
								tickLine={{ stroke: "#6b7280" }}
								axisLine={{ stroke: "#6b7280" }}
								tickFormatter={(value) => formatCurrency(Number(value))}
								width={70}
							/>
							<Tooltip
								formatter={(value: number) => [`$${value.toLocaleString()}`, "Cumulative Spend"]}
								labelFormatter={(label) => `${label}:00 UTC`}
								contentStyle={{
									backgroundColor: "white",
									border: "1px solid #374151",
									borderRadius: "6px",
									fontSize: "12px",
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


