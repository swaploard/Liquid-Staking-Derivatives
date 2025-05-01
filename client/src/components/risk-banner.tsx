import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface RiskBannerProps {
  healthFactor: number
}

export default function RiskBanner({ healthFactor }: RiskBannerProps) {
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Liquidation Risk</AlertTitle>
      <AlertDescription>
        {healthFactor < 1 ? (
          <span>
            Your position is below the liquidation threshold and may be liquidated at any time. Repay your loan or add
            more collateral immediately.
          </span>
        ) : (
          <span>
            Your health factor of {healthFactor.toFixed(2)} is close to the liquidation threshold of 1.0. Consider
            adding more collateral or repaying part of your loan.
          </span>
        )}
      </AlertDescription>
    </Alert>
  )
}
