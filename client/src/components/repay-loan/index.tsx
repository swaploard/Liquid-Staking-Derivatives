"use client"

import { useState } from "react"
import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { vaultStore } from "@/store/valutStore"
import { useRepayStableCoin } from "./hooks"
import { Step } from "@/types"
import Stepper from "@/components/stepper"

const repayingSteps: Step[] = [
  {
    title: 'Go to your wallet to approve this transaction',
    description: 'A blockchain transaction is required for repaying.',
    status: 'pending' as const,
  },
  {
    title: 'Borrowing stabelcoin',
    description: 'Please stay on this page and keep this browser tab open.',
    status: 'pending' as const,
  },
]

export default function RepayLoan() {
  const { borrowedInfo } = vaultStore()
  const [token, setToken] = useState("DAI")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showStepper, setShowStepper] = useState(false);
  const [steps, setSteps] = useState<Step[]>(repayingSteps);
  const { handleRepayAmount } = useRepayStableCoin({setSteps, setShowStepper, setIsLoading})
  
  const handleRepay = () => {
    if (!amount || Number.parseFloat(amount) <= 0) return
    handleRepayAmount(Number.parseFloat(amount))
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Repay Loan</h3>
        <p className="text-sm text-muted-foreground">
          Repay your borrowed stablecoins to reduce debt and improve health factor.
        </p>
      </div>
      {showStepper && <Stepper steps={steps}/>}
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="repay-token">Select Token</Label>
          <Select value={token} onValueChange={setToken}>
            <SelectTrigger id="repay-token">
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
            <Label htmlFor="repay-amount">Amount</Label>
            <span className="text-sm text-muted-foreground">Debt: ${borrowedInfo.borrowedAmount.toLocaleString()}</span>
          </div>
          <div className="relative">
            <Input
              id="repay-amount"
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pr-20"
              step="0.01"
              min="0"
              max={borrowedInfo.borrowedAmount.toString()}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
              {token}
            </div>
          </div>
          <div className="text-right">
            <button
              className="text-blue-600 hover:text-blue-700 text-xs"
              onClick={() => setAmount(borrowedInfo.borrowedAmount.toFixed(2))}
            >
              REPAY ALL
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
          <div className="font-medium">Remaining Debt After Repayment</div>
          <div>${Math.max(0, borrowedInfo.borrowedAmount - (Number.parseFloat(amount) || 0)).toLocaleString()}</div>
        </div>

        <Button
          onClick={handleRepay}
          disabled={
            !amount || Number.parseFloat(amount) <= 0 || Number.parseFloat(amount) > borrowedInfo.borrowedAmount || isLoading
          }
          className="w-full"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              <span>Repaying...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Repay {token}</span>
              <ArrowUp className="h-4 w-4" />
            </div>
          )}
        </Button>
      </div>
    </div>
  )
}
