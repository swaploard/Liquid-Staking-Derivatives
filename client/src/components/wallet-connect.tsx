"use client"

import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface WalletConnectProps {
  isConnected: boolean
  onConnect: () => void
}

export default function WalletConnect({ isConnected, onConnect }: WalletConnectProps) {
  const [open, setOpen] = useState(false)

  const handleConnect = () => {
    onConnect()
    setOpen(false)
  }

  if (isConnected) {
    return (
      <Button variant="outline" className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-green-500"></span>
        <span className="hidden sm:inline">0x71C...4E3f</span>
        <span className="sm:hidden">Connected</span>
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>

      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect your wallet</DialogTitle>
          <DialogDescription>Connect your wallet to access the DeFi lending platform.</DialogDescription>
        </DialogHeader>
        {/* <div className="grid gap-4 py-4">
          <Button onClick={handleConnect} className="flex items-center justify-between w-full" variant="outline">
            <span>MetaMask</span>
            <img src="/placeholder.svg?height=24&width=24" alt="MetaMask" className="h-6 w-6" />
          </Button>
          <Button onClick={handleConnect} className="flex items-center justify-between w-full" variant="outline">
            <span>WalletConnect</span>
            <img src="/placeholder.svg?height=24&width=24" alt="WalletConnect" className="h-6 w-6" />
          </Button>
          <Button onClick={handleConnect} className="flex items-center justify-between w-full" variant="outline">
            <span>Coinbase Wallet</span>
            <img src="/placeholder.svg?height=24&width=24" alt="Coinbase Wallet" className="h-6 w-6" />
          </Button>
        </div> */}
      </DialogContent>
    </Dialog>
  )
}
