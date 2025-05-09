"use client"

import { useState } from "react"
import CollateralVault from "@/contracts/CollateralVault.json";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Stepper from "@/components/stepper"
import { ArrowRight } from "lucide-react"
import { Address, parseEther } from "viem";
import { useReadContract, useAccount } from "wagmi";
import { Step } from "@/types";
import { useDepositCollateral } from "./hook";

const bETHAddress = process.env.NEXT_PUBLIC_MOCK_BETH_ADDRESS
const stETHAddress = process.env.NEXT_PUBLIC_MOCK_STETH_ADDRESS
const rETHAddress = process.env.NEXT_PUBLIC_MOCK_RETH_ADDRESS
const vaultContract = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS

const depositSteps: Step[] = [
  {
    title: 'Go to your wallet to approve this transaction',
    description: 'A blockchain transaction is required to deposite.',
    status: 'pending' as const,
  },
  {
    title: 'Deposit your collateral',
    description: 'Please stay on this page and keep this browser tab open.',
    status: 'pending' as const,
  },
]

export default function DepositCollateral() {
  const [token, setToken] = useState({ token: "", address: "" })
  const { chainId } = useAccount()
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showStepper, setShowStepper] = useState(false);
  const [steps, setSteps] = useState<Step[]>(depositSteps);
  const { depositCollateral } = useDepositCollateral({setSteps, setShowStepper, setIsLoading});
  const { data: tokenUSDValue } = useReadContract({
    address: vaultContract as Address,
    abi: CollateralVault.abi,
    functionName: "getCollateralValueInUSD",
    args: [token.address, parseEther(amount)],
    chainId: chainId
  })

  const handleDeposit = async() => {
    if (!amount || Number.parseFloat(amount) <= 0) return
    await depositCollateral(token.address as Address, parseEther(amount))
    setAmount("")
    setToken({ token: "", address: "" })
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
        <h3 className="text-lg font-medium">Deposit Collateral</h3>
        <p className="text-sm text-muted-foreground">Deposit your LSD tokens as collateral to borrow stablecoins.</p>
      </div>
      {showStepper && <Stepper steps={steps}/>}
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="token">Select Token</Label>
          <Select value={token.token} onValueChange={handleTokenChange}>
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
              {token.token}
            </div>
          </div>
          <div className="text-sm text-muted-foreground flex justify-between">
            <span>≈ ${tokenUSDValue?.toString() || '0'}</span>
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
              <span>Deposit {""}</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </Button>
      </div>
    </div>
  )
}
