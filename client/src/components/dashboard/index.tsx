"use client"

import { useState } from "react"
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import DashboardOverview from "@/components/dashboard-overview/index"
import DepositCollateral from "@/components/deposite-collateral"
import BorrowStablecoin from "@/components/borrow-stablecoin"
import RepayLoan from "@/components/repay-loan"
import WithdrawCollateral from "@/components/withdraw-collateral"
import RiskBanner from "@/components/risk-banner"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { useAccount } from 'wagmi'

import { useDashboard } from "./hooks"
export default function DashboardPage() {
  const { openConnectModal } = useConnectModal()
  const { isConnected, address } = useAccount()
  const { vaultExist, createVault } = useDashboard()
  const [healthFactor, setHealthFactor] = useState(2.5)
  const [collateralValue, setCollateralValue] = useState(10000)
  const [borrowedAmount, setBorrowedAmount] = useState(3000)
  const [collateralBalances, setCollateralBalances] = useState({
    stETH: 2.5,
    rETH: 1.2,
    bETH: 0.8,
  })

  // Mock function to simulate wallet connection
  const handleConnect = () => {
    if (!isConnected && openConnectModal) {
      openConnectModal();
    }
  }

  // Calculate borrow limit (75% of collateral value)
  const borrowLimit = collateralValue * 0.75

  // Update health factor when borrowing or repaying
  const updateHealthFactor = (newBorrowedAmount: number) => {
    if (newBorrowedAmount === 0) {
      setHealthFactor(10)
    } else {
      const newHealthFactor = (borrowLimit / newBorrowedAmount) * 1.5
      setHealthFactor(Number.parseFloat(newHealthFactor.toFixed(2)))
    }
    setBorrowedAmount(newBorrowedAmount)
  }

  // Update collateral value when depositing or withdrawing
  const updateCollateralValue = (newCollateralValue: number) => {
    setCollateralValue(newCollateralValue)
    // Recalculate health factor
    if (borrowedAmount > 0) {
      const newBorrowLimit = newCollateralValue * 0.75
      const newHealthFactor = (newBorrowLimit / borrowedAmount) * 1.5
      setHealthFactor(Number.parseFloat(newHealthFactor.toFixed(2)))
    }
  }

  // Update collateral balances
  const updateCollateralBalance = (token: string, amount: number, isDeposit: boolean) => {
    setCollateralBalances((prev) => {
      const newBalances = { ...prev }
      if (isDeposit) {
        newBalances[token as keyof typeof collateralBalances] += amount
      } else {
        newBalances[token as keyof typeof collateralBalances] -= amount
      }
      return newBalances
    })
  }
  
  const handleCreateVault = async () => {
    await createVault()
  }
  console.log("DashboardPage", vaultExist)
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            DeFi Lending
          </h1>
          {isConnected ? (
          <span className="text-xs font-semibold"> {address?.slice(0, 6)}...{address?.slice(-4)} </span>
          ) :
          ( <Button className="flex items-center gap-2 bg-black" onClick={handleConnect}>
            <Wallet className="h-4 w-4" />
            <span>Connect Wallet</span>
          </Button>)}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isConnected && vaultExist ? (
          <>
            {healthFactor < 1.2 && <RiskBanner healthFactor={healthFactor} />}

            <DashboardOverview
              collateralBalances={collateralBalances}
              collateralValue={collateralValue}
              borrowLimit={borrowLimit}
              borrowedAmount={borrowedAmount}
              healthFactor={healthFactor}
            />

            <Tabs defaultValue="deposit" className="mt-8">
              <TabsList className="grid grid-cols-4 mb-8">
                <TabsTrigger value="deposit">Deposit</TabsTrigger>
                <TabsTrigger value="borrow">Borrow</TabsTrigger>
                <TabsTrigger value="repay">Repay</TabsTrigger>
                <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
              </TabsList>

              <TabsContent value="deposit">
                <Card>
                  <CardContent className="pt-6">
                    <DepositCollateral
                      onDeposit={(token, amount) => {
                        updateCollateralValue(
                          collateralValue + amount * (token === "stETH" ? 2000 : token === "rETH" ? 2200 : 1900),
                        )
                        updateCollateralBalance(token, amount, true)
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="borrow">
                <Card>
                  <CardContent className="pt-6">
                    <BorrowStablecoin
                      borrowLimit={borrowLimit}
                      borrowedAmount={borrowedAmount}
                      healthFactor={healthFactor}
                      onBorrow={(amount) => {
                        updateHealthFactor(borrowedAmount + amount)
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="repay">
                <Card>
                  <CardContent className="pt-6">
                    <RepayLoan
                      borrowedAmount={borrowedAmount}
                      onRepay={(amount) => {
                        const newBorrowedAmount = Math.max(0, borrowedAmount - amount)
                        updateHealthFactor(newBorrowedAmount)
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="withdraw">
                <Card>
                  <CardContent className="pt-6">
                    <WithdrawCollateral
                      collateralBalances={collateralBalances}
                      healthFactor={healthFactor}
                      borrowedAmount={borrowedAmount}
                      onWithdraw={(token, amount) => {
                        const tokenValue = amount * (token === "stETH" ? 2000 : token === "rETH" ? 2200 : 1900)
                        updateCollateralValue(collateralValue - tokenValue)
                        updateCollateralBalance(token, amount, false)
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <h2 className="text-2xl font-semibold mb-6">Connect your wallet to get started</h2>
            <Button className="flex items-center gap-2 bg-black" onClick={handleCreateVault}>
              <Wallet className="h-4 w-4" />
              <span>Create your vault</span>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
