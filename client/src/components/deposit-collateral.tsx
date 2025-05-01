"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight } from "lucide-react"

interface DepositCollateralProps {
  onDeposit: (token: string, amount: number) => void
}

export default function DepositCollateral({ onDeposit }: DepositCollateralProps) {
  const [token, setToken] = useState("stETH")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleDeposit = () => {
    if (!amount || Number.parseFloat(amount) <= 0) return

    setIsLoading(true)

    // Simulate transaction delay
    setTimeout(() => {
      onDeposit(token, Number.parseFloat(amount))
      setAmount("")
      setIsLoading(false)
    }, 1500)
  }

  const getTokenPrice = () => {
    switch (token) {
      case "stETH":
        return 2000
      case "rETH":
        return 2200
      case "bETH":
        return 1900
      default:
        return 2000
    }
  }

  const usdValue = amount ? Number.parseFloat(amount) * getTokenPrice() : 0

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Deposit Collateral</h3>
        <p className="text-sm text-muted-foreground">Deposit your LSD tokens as collateral to borrow stablecoins.</p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="token">Select Token</Label>
          <Select value={token} onValueChange={setToken}>
            <SelectTrigger id="token">
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
          <Label htmlFor="amount">Amount</Label>
          <div className="relative">
            <Input
              id="amount"
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pr-20"
              step="0.01"
              min="0"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
              {token}
            </div>
          </div>
          <div className="text-sm text-muted-foreground flex justify-between">
            <span>≈ ${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            <button className="text-blue-600 hover:text-blue-700 text-xs" onClick={() => setAmount("1.0")}>
              MAX
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
          <div className="font-medium">Collateral Factor</div>
          <div>75%</div>
        </div>

        <Button
          onClick={handleDeposit}
          disabled={!amount || Number.parseFloat(amount) <= 0 || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              <span>Depositing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Deposit {token}</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </Button>
      </div>
    </div>
  )
}
