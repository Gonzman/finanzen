<script setup lang="ts">
import type { ChartConfig } from "@/components/ui/chart"

// import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { VisArea, VisAxis, VisLine, VisXYContainer } from "@unovis/vue"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {

    ChartContainer,
    ChartCrosshair,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    componentToString,
} from "@/components/ui/chart"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { onMounted, ref } from "vue"
import { computed } from "vue"
import type { OverviewTransactionResponse } from "@/lib/pocketbase-types"
import { usePocketBase } from "@/components/usePocketbase"
import { item } from "@unovis/ts/components/bullet-legend/style"

const description = "An interactive area chart"

const chartData = ref<{ date: Date; bank: number, kasse: number, insgesamt: number }[]>([])

const fetchTransactions = () => {
    usePocketBase().collection('overview_transaction').getFullList()
        .then((res) => {
            // Group transactions by date
            const groupedByDate = new Map<string, { bank: number; kasse: number }>();

            res.forEach((item) => {
                const dateKey = new Date(item.created).toISOString().split('T')[0];
                const existing = groupedByDate.get(dateKey) || { bank: 0, kasse: 0 };

                groupedByDate.set(dateKey, {
                    bank: existing.bank + (item.amount ?? 0),
                    kasse: existing.kasse + (item.amount_bar ?? 0),
                });
            });

            // Convert grouped data to chart data with cumulative totals
            let totalBank = 0;
            let totalKasse = 0;

            const sortedDates = Array.from(groupedByDate.keys()).sort();

            chartData.value = sortedDates.map(dateKey => {
                const data = groupedByDate.get(dateKey)!;
                totalBank += data.bank;
                totalKasse += data.kasse;

                return {
                    date: new Date(dateKey),
                    bank: totalBank,
                    kasse: totalKasse,
                    insgesamt: totalBank + totalKasse,
                };
            });
        })
        .catch((err) => {
            console.error('Error fetching transactions:', err);
        });
};




type Data = { date: Date; bank: number; kasse: number; insgesamt: number }

const chartConfig = {
    kasse: {
        label: "Kasse",
        color: "var(--chart-2)",
    },
    bank: {
        label: "Bank",
        color: "var(--chart-1)",
    },
    insgesamt: {
        label: "Insgesamt",
        color: "var(--chart-3)",
    },
} satisfies ChartConfig

const svgDefs = `
  <linearGradient id="fillBank" x1="0" y1="0" x2="0" y2="1">
    <stop
      offset="5%"
      stop-color="var(--color-bank)"
      stop-opacity="0.8"
    />
    <stop
      offset="95%"
      stop-color="var(--color-bank)"
      stop-opacity="0.1"
    />
  </linearGradient>
  <linearGradient id="fillKasse" x1="0" y1="0" x2="0" y2="1">
    <stop
      offset="5%"
      stop-color="var(--color-kasse)"
      stop-opacity="0.8"
    />
    <stop
      offset="95%"
      stop-color="var(--color-kasse)"
      stop-opacity="0.1"
    />
  </linearGradient>
    <linearGradient id="fillInsgesamt" x1="0" y1="0" x2="0" y2="1">
    <stop
      offset="5%"
      stop-color="var(--color-insgesamt)"
      stop-opacity="0.8"
    />
    <stop
      offset="95%"
      stop-color="var(--color-insgesamt)"
      stop-opacity="0.1"
    />
  </linearGradient>
`

const timeRange = ref("90d")
const filterRange = computed(() => {
    return chartData.value.filter((item) => {
        const date = new Date(item.date)
        const referenceDate = new Date("2024-06-30")
        let daysToSubtract = 90
        if (timeRange.value === "30d") {
            daysToSubtract = 30
        }
        else if (timeRange.value === "7d") {
            daysToSubtract = 7
        }
        const startDate = new Date(referenceDate)
        startDate.setDate(startDate.getDate() - daysToSubtract)
        return date >= startDate
    })
})

const yDomain = computed(() => {
    if (filterRange.value.length === 0) return [-500, 1200]

    const allValues = filterRange.value.flatMap(d => [d.bank, d.kasse, d.insgesamt])
    const minValue = Math.min(...allValues, 0)
    const maxValue = Math.max(...allValues, 0)

    const padding = Math.max(Math.abs(maxValue), Math.abs(minValue)) * 0.1

    return [Math.floor(minValue - padding), Math.ceil(maxValue + padding)]
})

onMounted(() => {
    fetchTransactions();
});
</script>

<template>
    <Card class="pt-0">
        <CardHeader class="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div class="grid flex-1 gap-1">
                <CardTitle>Area Chart - Interactive</CardTitle>
                <CardDescription>
                    Showing total visitors for the last 3 months
                </CardDescription>
            </div>
            <Select v-model="timeRange">
                <SelectTrigger class="hidden w-[160px] rounded-lg sm:ml-auto sm:flex" aria-label="Select a value">
                    <SelectValue placeholder="Last 3 months" />
                </SelectTrigger>
                <SelectContent class="rounded-xl">
                    <SelectItem value="90d" class="rounded-lg">
                        Last 3 months
                    </SelectItem>
                    <SelectItem value="30d" class="rounded-lg">
                        Last 30 days
                    </SelectItem>
                    <SelectItem value="7d" class="rounded-lg">
                        Last 7 days
                    </SelectItem>
                </SelectContent>
            </Select>
        </CardHeader>
        <CardContent class="px-2 pt-4 sm:px-6 sm:pt-6 pb-4">
            <ChartContainer :config="chartConfig" class="aspect-auto h-[250px] w-full" :cursor="false">
                <VisXYContainer :data="filterRange" :svg-defs="svgDefs" :margin="{ left: -40 }" :y-domain="yDomain">
                    <VisArea :x="(d: Data) => d.date" :y="[(d: Data) => d.kasse, (d: Data) => d.bank]"
                        :color="(d: Data, i: number) => ['url(#fillKasse)', 'url(#fillBank)'][i]" :opacity="0.6" />
                    <VisLine :x="(d: Data) => d.date" :y="[(d: Data) => d.kasse, (d: Data) => d.kasse + d.bank]"
                        :color="(d: Data, i: number) => [chartConfig.kasse.color, chartConfig.bank.color][i]"
                        :line-width="1" />
                    <VisAxis type="x" :x="(d: Data) => d.date" :tick-line="false" :domain-line="false"
                        :grid-line="false" :num-ticks="6" :tick-format="(d: number, index: number) => {
                            const date = new Date(d)
                            return date.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                            })
                        }" />
                    <VisAxis type="y" :num-ticks="3" :tick-line="false" :domain-line="false" />
                    <ChartTooltip />
                    <ChartCrosshair :template="componentToString(chartConfig, ChartTooltipContent, {
                        labelFormatter: (d) => {
                            return new Date(d).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                            })
                        },
                    })" :color="(d: Data, i: number) => [chartConfig.kasse.color, chartConfig.bank.color][i % 2]" />
                </VisXYContainer>

                <ChartLegendContent />
            </ChartContainer>
        </CardContent>
    </Card>
</template>
