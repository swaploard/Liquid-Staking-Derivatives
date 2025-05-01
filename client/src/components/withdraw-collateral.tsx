"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import HealthFactorIndicator from "@/components/health-factor-indicator"

interface WithdrawCollateralProps {
  collateralBalances: {
    stETH: number
    rETH: number
    bETH: number
  }
  healthFactor: number
  borrowedAmount: number
  onWithdraw: (token: string, amount: number) => void
}

export default function WithdrawCollateral({
  collateralBalances,
  healthFactor,
  borrowedAmount,
  onWithdraw,
}: WithdrawCollateralProps) {
  const [token, setToken] = useState("stETH")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Calculate new health factor based on withdrawal amount
  const calculateNewHealthFactor = (withdrawAmount: number) => {
    if (borrowedAmount === 0) return 10

    const tokenValue = withdrawAmount * (token === "stETH" ? 2000 : token === "rETH" ? 2200 : 1900)
    const totalCollateralValue =
      collateralBalances.stETH * 2000 + collateralBalances.rETH * 2200 + collateralBalances.bETH * 1900

    const newCollateralValue = totalCollateralValue - tokenValue
    const newBorrowLimit = newCollateralValue * 0.75

    if (newBorrowLimit <= 0) return 0
    return (newBorrowLimit / borrowedAmount) * 1.5
  }

  const newHealthFactor = calculateNewHealthFactor(Number.parseFloat(amount) || 0)
  const maxWithdrawable = collateralBalances[token as keyof typeof collateralBalances]

  const handleWithdraw = () => {
    if (!amount || Number.parseFloat(amount) <= 0) return

    setIsLoading(true)

    // Simulate transaction delay
    setTimeout(() => {
      onWithdraw(token, Number.parseFloat(amount))
      setAmount("")
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Withdraw Collateral</h3>
        <p className="text-sm text-muted-foreground">Withdraw your deposited collateral if your position allows it.</p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="withdraw-token">Select Token</Label>
          <Select
            value={token}
            onValueChange={(value) => {
              setToken(value)
              setAmount("")
            }}
          >
            <SelectTrigger id="withdraw-token">
              <SelectValue placeholder="Select token" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stETH">stETH</SelectItem>
              <SelectItem value="rETH">rETH</SelectItem>
              <SelectItem value="bETH">bETH</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <div className="flex justify-between">
            <Label htmlFor="withdraw-amount">Amount</Label>
            <span className="text-sm text-muted-foreground">
              Balance: {collateralBalances[token as keyof typeof collateralBalances].toFixed(4)} {token}
            </span>
          </div>
          <div className="relative">
            <Input
              id="withdraw-amount"
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pr-20"
              step="0.001"
              min="0"
              max={maxWithdrawable.toString()}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
              {token}
            </div>
          </div>
          <div className="text-right">
            <button
              className="text-blue-600 hover:text-blue-700 text-xs"
              onClick={() => {
                // If there's no borrowed amount, allow full withdrawal
                if (borrowedAmount === 0) {
                  setAmount(maxWithdrawable.toFixed(4))
                } else {
                  // Calculate max safe withdrawal amount
                  let safeAmount = 0
                  const step = maxWithdrawable / 20

                  for (let i = 0; i <= maxWithdrawable; i += step) {
                    const hf = calculateNewHealthFactor(i)
                    if (hf < 1.2) {
                      safeAmount = Math.max(0, i - step)
                      break
                    }
                    safeAmount = i
                  }

                  setAmount(safeAmount.toFixed(4))
                }
              }}
            >
              MAX SAFE
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
          <div className="font-medium">Health Factor After Withdrawal</div>
          <div className="flex items-center gap-2">
            {newHealthFactor.toFixed(2)}
            <HealthFactorIndicator healthFactor={newHealthFactor} />
          </div>
        </div>

        <Button
          onClick={handleWithdraw}
          disabled={
            !amount ||
            Number.parseFloat(amount) <= 0 ||
            Number.parseFloat(amount) > maxWithdrawable ||
            isLoading ||
            (borrowedAmount > 0 && newHealthFactor < 1.05)
          }
          className="w-full"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              <span>Withdrawing...</span>
            </div>
          ) : borrowedAmount > 0 && newHealthFactor < 1.05 ? (
            <span>Health Factor Too Low</span>
          ) : (
            <div className="flex items-center gap-2">
              <span>Withdraw {token}</span>
              <ArrowLeft className="h-4 w-4" />
            </div>
          )}
        </Button>
      </div>
    </div>
  )
}
