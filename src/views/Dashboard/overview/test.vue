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
import { ref } from "vue"
import { computed } from "vue"

const description = "An interactive area chart"

const chartData: { date: Date; bank: number, kasse: number, insgesamt: number }[] = [
    { date: new Date("2024-04-01"), bank: 222, kasse: -150, insgesamt: 372 },
    { date: new Date("2024-04-02"), bank: 97, kasse: -180, insgesamt: 277 },
    { date: new Date("2024-04-03"), bank: 167, kasse: 120, insgesamt: 287 },
    { date: new Date("2024-04-04"), bank: 242, kasse: 260, insgesamt: 502 },
    { date: new Date("2024-04-05"), bank: 373, kasse: 290, insgesamt: 663 },
    { date: new Date("2024-04-06"), bank: 301, kasse: 340, insgesamt: 641 },
    { date: new Date("2024-04-07"), bank: 245, kasse: 180, insgesamt: 425 },
    { date: new Date("2024-04-08"), bank: 409, kasse: 320, insgesamt: 729 },
    { date: new Date("2024-04-09"), bank: 59, kasse: 110, insgesamt: 169 },
    { date: new Date("2024-04-10"), bank: 261, kasse: 190, insgesamt: 451 },
    { date: new Date("2024-04-11"), bank: 327, kasse: 350, insgesamt: 677 },
    { date: new Date("2024-04-12"), bank: 292, kasse: 210, insgesamt: 502 },
    { date: new Date("2024-04-13"), bank: 342, kasse: 380, insgesamt: 722 },
    { date: new Date("2024-04-14"), bank: 137, kasse: 220, insgesamt: 357 },
    { date: new Date("2024-04-15"), bank: 120, kasse: 170, insgesamt: 290 },
    { date: new Date("2024-04-16"), bank: 138, kasse: 190, insgesamt: 328 },
    { date: new Date("2024-04-17"), bank: 446, kasse: 360, insgesamt: 806 },
    { date: new Date("2024-04-18"), bank: 364, kasse: 410, insgesamt: 774 },
    { date: new Date("2024-04-19"), bank: 243, kasse: 180, insgesamt: 423 },
    { date: new Date("2024-04-20"), bank: 89, kasse: 150, insgesamt: 239 },
    { date: new Date("2024-04-21"), bank: 137, kasse: 200, insgesamt: 337 },
    { date: new Date("2024-04-22"), bank: 224, kasse: 170, insgesamt: 394 },
    { date: new Date("2024-04-23"), bank: 138, kasse: 230, insgesamt: 368 },
    { date: new Date("2024-04-24"), bank: 387, kasse: 290, insgesamt: 677 },
    { date: new Date("2024-04-25"), bank: 215, kasse: 250, insgesamt: 465 },
    { date: new Date("2024-04-26"), bank: 75, kasse: 130, insgesamt: 205 },
    { date: new Date("2024-04-27"), bank: 383, kasse: 420, insgesamt: 803 },
    { date: new Date("2024-04-28"), bank: 122, kasse: 180, insgesamt: 302 },
    { date: new Date("2024-04-29"), bank: 315, kasse: 240, insgesamt: 555 },
    { date: new Date("2024-04-30"), bank: 454, kasse: 380, insgesamt: 834 },
    { date: new Date("2024-05-01"), bank: 165, kasse: 220, insgesamt: 385 },
    { date: new Date("2024-05-02"), bank: 293, kasse: 310, insgesamt: 603 },
    { date: new Date("2024-05-03"), bank: 247, kasse: 190, insgesamt: 437 },
    { date: new Date("2024-05-04"), bank: 385, kasse: 420, insgesamt: 805 },
    { date: new Date("2024-05-05"), bank: 481, kasse: 390, insgesamt: 871 },
    { date: new Date("2024-05-06"), bank: 498, kasse: 520, insgesamt: 1018 },
    { date: new Date("2024-05-07"), bank: 388, kasse: 300, insgesamt: 688 },
    { date: new Date("2024-05-08"), bank: 149, kasse: 210, insgesamt: 359 },
    { date: new Date("2024-05-09"), bank: 227, kasse: 180, insgesamt: 407 },
    { date: new Date("2024-05-10"), bank: 293, kasse: 330, insgesamt: 623 },
    { date: new Date("2024-05-11"), bank: 335, kasse: 270, insgesamt: 605 },
    { date: new Date("2024-05-12"), bank: 197, kasse: 240, insgesamt: 437 },
    { date: new Date("2024-05-13"), bank: 197, kasse: 160, insgesamt: 357 },
    { date: new Date("2024-05-14"), bank: 448, kasse: 490, insgesamt: 938 },
    { date: new Date("2024-05-15"), bank: 473, kasse: 380, insgesamt: 853 },
    { date: new Date("2024-05-16"), bank: 338, kasse: 400, insgesamt: 738 },
    { date: new Date("2024-05-17"), bank: 499, kasse: 420, insgesamt: 919 },
    { date: new Date("2024-05-18"), bank: 315, kasse: 350, insgesamt: 665 },
    { date: new Date("2024-05-19"), bank: 235, kasse: 180, insgesamt: 415 },
    { date: new Date("2024-05-20"), bank: 177, kasse: 230, insgesamt: 407 },
    { date: new Date("2024-05-21"), bank: 82, kasse: 140, insgesamt: 222 },
    { date: new Date("2024-05-22"), bank: 81, kasse: 120, insgesamt: 201 },
    { date: new Date("2024-05-23"), bank: 252, kasse: 290, insgesamt: 542 },
    { date: new Date("2024-05-24"), bank: 294, kasse: 220, insgesamt: 514 },
    { date: new Date("2024-05-25"), bank: 201, kasse: 250, insgesamt: 451 },
    { date: new Date("2024-05-26"), bank: 213, kasse: 170, insgesamt: 383 },
    { date: new Date("2024-05-27"), bank: 420, kasse: 460, insgesamt: 880 },
    { date: new Date("2024-05-28"), bank: 233, kasse: 190, insgesamt: 423 },
    { date: new Date("2024-05-29"), bank: 78, kasse: 130, insgesamt: 208 },
    { date: new Date("2024-05-30"), bank: 340, kasse: 280, insgesamt: 620 },
    { date: new Date("2024-05-31"), bank: 178, kasse: 230, insgesamt: 408 },
    { date: new Date("2024-06-01"), bank: 178, kasse: 200, insgesamt: 378 },
    { date: new Date("2024-06-02"), bank: 470, kasse: 410, insgesamt: 880 },
    { date: new Date("2024-06-03"), bank: 103, kasse: 160, insgesamt: 263 },
    { date: new Date("2024-06-04"), bank: 439, kasse: 380, insgesamt: 819 },
    { date: new Date("2024-06-05"), bank: 88, kasse: 140, insgesamt: 228 },
    { date: new Date("2024-06-06"), bank: 294, kasse: 250, insgesamt: 544 },
    { date: new Date("2024-06-07"), bank: 323, kasse: 370, insgesamt: 693 },
    { date: new Date("2024-06-08"), bank: 385, kasse: 320, insgesamt: 705 },
    { date: new Date("2024-06-09"), bank: 438, kasse: 480, insgesamt: 918 },
    { date: new Date("2024-06-10"), bank: 155, kasse: 200, insgesamt: 355 },
    { date: new Date("2024-06-11"), bank: 92, kasse: 150, insgesamt: 242 },
    { date: new Date("2024-06-12"), bank: 492, kasse: 420, insgesamt: 912 },
    { date: new Date("2024-06-13"), bank: 81, kasse: 130, insgesamt: 211 },
    { date: new Date("2024-06-14"), bank: 426, kasse: 380, insgesamt: 806 },
    { date: new Date("2024-06-15"), bank: 307, kasse: 350, insgesamt: 657 },
    { date: new Date("2024-06-16"), bank: 371, kasse: 310, insgesamt: 681 },
    { date: new Date("2024-06-17"), bank: 475, kasse: 520, insgesamt: 995 },
    { date: new Date("2024-06-18"), bank: 107, kasse: 170, insgesamt: 277 },
    { date: new Date("2024-06-19"), bank: 341, kasse: 290, insgesamt: 631 },
    { date: new Date("2024-06-20"), bank: 408, kasse: 450, insgesamt: 858 },
    { date: new Date("2024-06-21"), bank: 169, kasse: 210, insgesamt: 379 },
    { date: new Date("2024-06-22"), bank: 317, kasse: 270, insgesamt: 587 },
    { date: new Date("2024-06-23"), bank: 480, kasse: 530, insgesamt: 1010 },
    { date: new Date("2024-06-24"), bank: 132, kasse: 180, insgesamt: 312 },
    { date: new Date("2024-06-25"), bank: 141, kasse: 190, insgesamt: 331 },
    { date: new Date("2024-06-26"), bank: 434, kasse: 380, insgesamt: 814 },
    { date: new Date("2024-06-27"), bank: 448, kasse: 490, insgesamt: 938 },
    { date: new Date("2024-06-28"), bank: 149, kasse: 200, insgesamt: 349 },
    { date: new Date("2024-06-29"), bank: 103, kasse: 160, insgesamt: 263 },
    { date: new Date("2024-06-30"), bank: 446, kasse: 400, insgesamt: 846 },
]
type Data = typeof chartData[number]

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
`

const timeRange = ref("90d")
const filterRange = computed(() => {
    return chartData.filter((item) => {
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
                <VisXYContainer :data="filterRange" :svg-defs="svgDefs" :margin="{ left: -40 }" :y-domain="[0, 1200]">
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
