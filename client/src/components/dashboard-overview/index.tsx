import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowUpRight, Wallet, Coins, Activity } from "lucide-react"
import HealthFactorIndicator from "@/components/health-factor-indicator"
import {useOverview} from "./hooks"

interface DashboardOverviewProps {
  collateralBalances: {
    stETH: number
    rETH: number
    bETH: number
  }
  collateralValue: number
  borrowLimit: number
  borrowedAmount: number
  healthFactor: number
}

export default function DashboardOverview({
  collateralBalances,
  collateralValue,
  borrowLimit,
  borrowedAmount,
  healthFactor,
}: DashboardOverviewProps) {
  // Calculate utilization percentage
  const utilizationPercentage = borrowLimit > 0 ? (borrowedAmount / borrowLimit) * 100 : 0
  const { bETHConllateral, rETHConllateral, stETHConllateral } = useOverview()
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Collateral</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${collateralValue.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">
            <div className="flex items-center justify-between mt-2">
              <span>stETH</span>
              <span>{stETHConllateral ? Number(bETHConllateral).toFixed(4): 0}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>rETH</span>
              <span>{rETHConllateral ? Number(bETHConllateral).toFixed(4): 0}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>bETH</span>
              <span>{bETHConllateral ? Number(bETHConllateral).toFixed(4): 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Borrow Limit</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${borrowLimit.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">75% of your collateral value</div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs">Used: {utilizationPercentage.toFixed(0)}%</span>
              <span className="text-xs">${borrowedAmount.toLocaleString()}</span>
            </div>
            <Progress value={utilizationPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Borrowed</CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${borrowedAmount.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">
            <div className="flex items-center justify-between mt-2">
              <span>DAI</span>
              <span>{(borrowedAmount * 0.6).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>USDC</span>
              <span>{(borrowedAmount * 0.4).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Health Factor</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold flex items-center gap-2">
            {healthFactor.toFixed(2)}
            <HealthFactorIndicator healthFactor={healthFactor} />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {healthFactor < 1 ? (
              <span className="text-red-500">Liquidation risk!</span>
            ) : healthFactor < 1.2 ? (
              <span className="text-amber-500">Near liquidation threshold</span>
            ) : (
              <span>Safe position</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
