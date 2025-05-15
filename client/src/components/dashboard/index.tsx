"use client"

import { useConnectModal } from '@rainbow-me/rainbowkit';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import DashboardOverview from "@/components/dashboard-overview/index"
import DepositCollateral from "@/components/deposite-collateral"
import BorrowStablecoin from "@/components/borrow-stablecoin"
import RepayLoan from "@/components/repay-loan"
import WithdrawCollateral from "@/components/withdraw-collateral"
// import RiskBanner from "@/components/risk-banner"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { useAccount } from 'wagmi'

import { useDashboard } from "./hooks"
export default function DashboardPage() {
  const { openConnectModal } = useConnectModal()
  const { isConnected, address } = useAccount()
  const { vaultExist, createVault } = useDashboard()

  const handleConnect = () => {
    if (!isConnected && openConnectModal) {
      openConnectModal();
    }
  }

  const handleCreateVault = async () => {
    await createVault()
  }

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
            {/* {healthFactor < 1.2 && <RiskBanner healthFactor={healthFactor} />} */}

            <DashboardOverview />

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
                    <DepositCollateral/>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="borrow">
                <Card>
                  <CardContent className="pt-6">
                    <BorrowStablecoin />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="repay">
                <Card>
                  <CardContent className="pt-6">
                    <RepayLoan
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="withdraw">
                <Card>
                  <CardContent className="pt-6">
                    <WithdrawCollateral />
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
