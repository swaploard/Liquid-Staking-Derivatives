import { useReadContract, useWriteContract, useAccount } from "wagmi"
import { Address } from "viem"
import CollateralVault from "@/contracts/CollateralVault.json";
import { toast } from "sonner"
import { useEffect, useState } from "react";

const vaultContract = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS

export const useDashboard = () => {
    const { chainId, address } = useAccount()
    const { writeContract } = useWriteContract()
    const [vaultExist, setVaultExist] = useState<boolean>(false);

    const { data: vault } = useReadContract({
        address: vaultContract as Address,
        abi: CollateralVault.abi,
        functionName: "vaults",
        args: [address],
        chainId: chainId,
    })

    useEffect(() => {
        setVaultExist(Boolean((vault as any[])?.[1]))
    }, [vault])

    const createVault = () => {
        writeContract({
            address: vaultContract as Address,
            abi: CollateralVault.abi,
            functionName: "createVault",
            chainId,
        }, {
            onSuccess: (data) => {
                console.log(data)
            },
            onError: (err) => {
                if (err.message?.includes('Connector not connected')) return toast.error("Please connect your wallet")
                console.error("create vault error", err)
            }
        })
    }
    return {
        createVault,
        vaultExist
    }
}