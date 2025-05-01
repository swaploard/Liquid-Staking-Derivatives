interface HealthFactorIndicatorProps {
  healthFactor: number
}

export default function HealthFactorIndicator({ healthFactor }: HealthFactorIndicatorProps) {
  let color = "bg-green-500"

  if (healthFactor < 1) {
    color = "bg-red-500"
  } else if (healthFactor < 1.2) {
    color = "bg-amber-500"
  } else if (healthFactor < 1.5) {
    color = "bg-yellow-500"
  }

  return <div className={`h-3 w-3 rounded-full ${color}`} title={`Health Factor: ${healthFactor.toFixed(2)}`} />
}
