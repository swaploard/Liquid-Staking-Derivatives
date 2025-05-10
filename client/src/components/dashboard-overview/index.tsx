import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowUpRight, Wallet, Coins, Activity } from "lucide-react"
import HealthFactorIndicator from "@/components/health-factor-indicator"
import { useCollateralOverview, useBorrowOverview } from "./hooks"

export default function DashboardOverview() {
  const { formattenSTETH, formattenRETH, formattenBETH, total} = useCollateralOverview()
  const { formattenBorrowableLimit, borrowedPercentage, borrowedAmount, helthFactor } = useBorrowOverview()

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Collateral</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${total}</div>
          <div className="text-xs text-muted-foreground mt-1">
            <div className="flex items-center justify-between mt-2">
              <span>stETH</span>
              <span>{formattenSTETH ? Number(formattenSTETH) : 0}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>rETH</span>
              <span>{formattenRETH ? Number(formattenRETH) : 0}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>bETH</span>
              <span>{formattenBETH ? Number(formattenBETH) : 0}</span>
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
          <div className="text-2xl font-bold">${formattenBorrowableLimit}</div>
          <div className="text-xs text-muted-foreground mt-1">75% of your collateral value</div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs">Used: {borrowedPercentage.toFixed(0)}%</span>
              <span className="text-xs">${String(borrowedAmount)}</span>
            </div>
            <Progress value={borrowedPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Borrowed</CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${String(borrowedAmount)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            <div className="flex items-center justify-between mt-2">
              <span>DAI</span>
              <span>{0}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>USDC</span>
              <span>{String(borrowedAmount)}</span>
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
            {Number(helthFactor).toFixed(2)}
            <HealthFactorIndicator healthFactor={Number(helthFactor)} />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {Number(helthFactor) < 1 ? (
              <span className="text-red-500">Liquidation risk!</span>
            ) : Number(helthFactor) < 1.2 ? (
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
