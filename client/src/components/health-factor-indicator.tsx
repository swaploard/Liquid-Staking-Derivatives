interface HealthFactorIndicatorProps {
  healthFactor: number
}

export default function HealthFactorIndicator({ healthFactor }: HealthFactorIndicatorProps) {
  let color = "bg-green-500"

  if (healthFactor < 120) {
    color = "bg-red-500"
  } else if (healthFactor < 130) {
    color = "bg-amber-500"
  } else if (healthFactor < 125) {
    color = "bg-yellow-500"
  }

  return <div className={`h-3 w-3 rounded-full ${color}`} title={`Health Factor: ${healthFactor.toFixed(2)}`} />
}
