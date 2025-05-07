import { useReadContract, useWriteContract } from "wagmi";
import { Address } from "viem";
import CollateralVault from "@/contracts/CollateralVault.json";

const vaultContract = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS

export const useDepositCollateral = () => {
    const { writeContract, } = useWriteContract()
    
    const depositCollateral = (token: Address, amount: Number) => {
        writeContract({
            address: vaultContract as Address,
            abi: CollateralVault.abi,
            functionName: "depositCollateral",
            args: [token, BigInt(amount.toString())],
        },
            {
                onSuccess: (data) => {
                    console.log(data)
                },
                onError: (err) => {
                    console.log(err)
                }
            })
    }

    return { depositCollateral }

}