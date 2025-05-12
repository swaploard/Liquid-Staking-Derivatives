"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import HealthFactorIndicator from "@/components/health-factor-indicator"
import { vaultStore } from "@/store/valutStore"
import CollateralVault from "@/contracts/CollateralVault.json";
import Stepper from "@/components/stepper"
import { useWithdrawCollateral } from "./hooks"
import { useAccount, useReadContract } from "wagmi"
import { Address, parseEther } from "viem"
import { Step } from "@/types"
interface WithdrawCollateralProps {
  collateralData: {
    stETH: number
    rETH: number
    bETH: number
  }
  healthFactor: number
  borrowedAmount: number
  onWithdraw: (token: string, amount: number) => void
}
const withdrawingSteps: Step[] = [
  {
    title: 'Go to your wallet to approve this transaction',
    description: 'A blockchain transaction is required to withdraw.',
    status: 'pending' as const,
  },
  {
    title: 'Borrowing stabelcoin',
    description: 'Please stay on this page and keep this browser tab open.',
    status: 'pending' as const,
  },
]
const bETHAddress = process.env.NEXT_PUBLIC_MOCK_BETH_ADDRESS
const stETHAddress = process.env.NEXT_PUBLIC_MOCK_STETH_ADDRESS
const rETHAddress = process.env.NEXT_PUBLIC_MOCK_RETH_ADDRESS
const vaultContract = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS

export default function WithdrawCollateral({
  onWithdraw,
}: WithdrawCollateralProps) {
  const { collateralData, borrowedInfo } = vaultStore()
  const [token, setToken] = useState({ token: "", address: "" })
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { chainId, address: userAddress } = useAccount();
  const [showStepper, setShowStepper] = useState(false);
  const [steps, setSteps] = useState<Step[]>(withdrawingSteps);
  const { handleWithdrawCollateral } = useWithdrawCollateral({setSteps, setShowStepper, setIsLoading})
  
  const { data: borrowingAmountUSD } = useReadContract({
    address: vaultContract as Address,
    abi: CollateralVault.abi,
    functionName: "getCollateralValueInUSD",
    args: [token.address, parseEther(amount)],
    chainId: chainId
  })

  const { data: avilableCollateral } = useReadContract({
    address: vaultContract as Address,
    abi: CollateralVault.abi,
    functionName: "getCollateralBalance",
    args: [userAddress, token.address],
    chainId: chainId,
})

  const calculateNewHealthFactor = () => {
    if (collateralData.total === 0) return 10
    const totalBorrowed = borrowedInfo.borrowedAmount + (Number(borrowingAmountUSD) || 0)
    if (totalBorrowed === 0) return 10
    return (Number(collateralData.total) * 100) / totalBorrowed
  }

  const newHealthFactor = calculateNewHealthFactor()
  const maxWithdrawable = collateralData[token.token as keyof typeof collateralData]

  const handleWithdraw = () => {
    if (!amount || Number.parseFloat(amount) <= 0) return
    handleWithdrawCollateral(parseEther(amount), token.address)
  }

  const handleTokenChange = (value: string) => {
    let address = ""
    switch (value) {
      case "stETH":
        address = String(stETHAddress)
        break
      case "rETH":
        address = String(rETHAddress)
        break
      case "bETH":
        address = String(bETHAddress)
        break
    }
    setToken({ token: value, address })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Withdraw Collateral</h3>
        <p className="text-sm text-muted-foreground">Withdraw your deposited collateral if your position allows it.</p>
      </div>
      {showStepper && <Stepper steps={steps}/>}
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="withdraw-token">Select Token</Label>
          <Select
            value={token.token}
            onValueChange={(value) => {
              handleTokenChange(value)
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
              Balance: {collateralData[token.token as keyof typeof collateralData]} {token.token}
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
              max={maxWithdrawable}
              disabled={Number(avilableCollateral) <= 0 || token.address === ""}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
              {token.token}
            </div>
          </div>
          <div className="flex justify-between">
            {Number(avilableCollateral) <= 0 ? <span className="text-xs text-red-700">No collteral avilable for the token.</span>: <span></span>}
            <button
              className="text-blue-600 hover:text-blue-700 text-xs"
              onClick={() => {
                // If there's no borrowed amount, allow full withdrawal
                if (borrowedInfo.borrowedAmount === 0) {
                  setAmount(maxWithdrawable.toFixed(4))
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
            {Number(newHealthFactor).toFixed(2)}
            <HealthFactorIndicator healthFactor={Number(newHealthFactor)} />
          </div>
        </div>

        <Button
          onClick={handleWithdraw}
          disabled={
            !amount ||
            Number.parseFloat(amount) <= 0 ||
            Number.parseFloat(amount) > maxWithdrawable ||
            isLoading ||
            (borrowedInfo.borrowedAmount > 0 && newHealthFactor < 120) ||
            token.address === "" ||
            borrowingAmountUSD === undefined
          }
          className="w-full"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              <span>Withdrawing...</span>
            </div>
          ) : borrowedInfo.borrowedAmount > 0 && newHealthFactor < 120 ? (
            <span>Health Factor Too Low</span>
          ) : (
            <div className="flex items-center gap-2">
              <span>Withdraw {token.token}</span>
              <ArrowLeft className="h-4 w-4" />
            </div>
          )}
        </Button>
      </div>
    </div>
  )
}
