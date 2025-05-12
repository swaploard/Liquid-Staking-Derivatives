"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Stepper from "@/components/stepper"
import { ArrowDown } from "lucide-react"
import HealthFactorIndicator from "@/components/health-factor-indicator"
import { vaultStore } from "@/store/valutStore"
import { useBorrowStablecoin } from "./hooks"
import { Step } from "@/types"

const borowingSteps: Step[] = [
  {
    title: 'Go to your wallet to approve this transaction',
    description: 'A blockchain transaction is required to deposite.',
    status: 'pending' as const,
  },
  {
    title: 'Borrowing stabelcoin',
    description: 'Please stay on this page and keep this browser tab open.',
    status: 'pending' as const,
  },
]

export default function BorrowStablecoin() {
  const [token, setToken] = useState("DAI")
  const [amount, setAmount] = useState("")
  const [sliderValue, setSliderValue] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showStepper, setShowStepper] = useState(false);
  const [steps, setSteps] = useState<Step[]>(borowingSteps);
  const { collateralData } = vaultStore()
  const { handleBorrowing, BorrowableLimitUSD, formattenBorrowedAmount } = useBorrowStablecoin({setSteps, setShowStepper, setIsLoading})
 
  const borrowedAmount = formattenBorrowedAmount;
  const borrowPercentage = Number(BorrowableLimitUSD) > 0 ? (borrowedAmount / Number(BorrowableLimitUSD)) * 100 : 0

  const calculateNewHealthFactor = (additionalBorrow: number) => {
    if (collateralData.total === 0) return 10
    const totalBorrowed = borrowedAmount + additionalBorrow
    if (totalBorrowed === 0) return 10
    return (Number(collateralData.total) * 100) / totalBorrowed
  }

  const newHealthFactor = calculateNewHealthFactor(Number.parseFloat(amount) || 0)

  const handleSliderChange = (value: number[]) => {
    const percentage = value[0]
    setSliderValue(percentage)

    if (percentage === 0) {
      setAmount("")
    } else {
      const amountValue = (Number(BorrowableLimitUSD) * (percentage / 100)).toFixed(2)
      setAmount(amountValue)
    }
  }

  const handleAmountChange = (value: string) => {
    setAmount(value)

    if (!value || Number.parseFloat(value) <= 0) {
      setSliderValue(0)
    } else {
      const percentage = Math.min(100, (Number.parseFloat(value) / Number(BorrowableLimitUSD)) * 100)
      setSliderValue(percentage)
    }
  }

  const handleBorrow = () => {
    if (!amount || Number.parseFloat(amount) <= 0) return
    handleBorrowing(Number(amount))
    setTimeout(() => {
      setSliderValue(0)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Borrow Stablecoins</h3>
        <p className="text-sm text-muted-foreground">Borrow stablecoins against your deposited collateral.</p>
      </div>
      {showStepper && <Stepper steps={steps}/>}
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="borrow-token">Select Token</Label>
          <Select value={token} onValueChange={setToken}>
            <SelectTrigger id="borrow-token">
              <SelectValue placeholder="Select token" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAI">DAI</SelectItem>
              <SelectItem value="USDC">USDC</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <div className="flex justify-between">
            <Label htmlFor="borrow-amount">Amount</Label>
            <span className="text-sm text-muted-foreground">Available: ${Number(BorrowableLimitUSD) - Number(borrowedAmount)}</span>
          </div>
          <div className="relative">
            <Input
              id="borrow-amount"
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="pr-20"
              step="0.01"
              min="0"
              max={Number(BorrowableLimitUSD)}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
              {token}
            </div>
          </div>
          <div className="text-right">
            <button
              className="text-blue-600 hover:text-blue-700 text-xs"
              onClick={() => handleAmountChange(Number(BorrowableLimitUSD).toFixed(2))}
            >
              MAX
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>0%</span>
            <span>{sliderValue.toFixed(0)}%</span>
            <span>100%</span>
          </div>
          <Slider value={[sliderValue]} max={100} step={1} onValueChange={handleSliderChange} />
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
          <div className="font-medium">Current Utilization</div>
          <div>{borrowPercentage.toFixed(0)}%</div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
          <div className="font-medium">Health Factor After Borrow</div>
          <div className="flex items-center gap-2">
            {newHealthFactor.toFixed(2)}
            <HealthFactorIndicator healthFactor={newHealthFactor} />
          </div>
        </div>

        <Button
          onClick={handleBorrow}
          disabled={
            !amount ||
            Number.parseFloat(amount) <= 0 ||
            Number.parseFloat(amount) > Number(BorrowableLimitUSD) ||
            isLoading ||
            newHealthFactor < 120
          }
          className="w-full"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              <span>Borrowing...</span>
            </div>
          ) : newHealthFactor < 120 ? (
            <span>Health Factor Too Low</span>
          ) : (
            <div className="flex items-center gap-2">
              <span>Borrow {token}</span>
              <ArrowDown className="h-4 w-4" />
            </div>
          )}
        </Button>
      </div>
    </div>
  )
}


