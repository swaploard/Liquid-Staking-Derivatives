import { useReadContract, useAccount } from "wagmi";
import CollateralVault from "@/contracts/CollateralVault.json";
import { Address, formatEther } from "viem";

const vaultContract = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS
const rETHAddress = process.env.NEXT_PUBLIC_MOCK_RETH_ADDRESS
const bETHAddress = process.env.NEXT_PUBLIC_MOCK_BETH_ADDRESS
const stETHAddress = process.env.NEXT_PUBLIC_MOCK_STETH_ADDRESS

export const useOverview = () => {
    const { address: userAddress, chainId } = useAccount();

    const { data: stETHConllateral } = useReadContract({
        address: vaultContract as Address,
        abi: CollateralVault.abi,
        functionName: "getCollateralBalance",
        args: [userAddress, stETHAddress],
        chainId: chainId,
    })

    const { data: rETHConllateral } = useReadContract({
        address: vaultContract as Address,
        abi: CollateralVault.abi,
        functionName: "getCollateralBalance",
        args: [userAddress, rETHAddress],
        chainId: chainId,
    })

    const { data: bETHConllateral } = useReadContract({
        address: vaultContract as Address,
        abi: CollateralVault.abi,
        functionName: "getCollateralBalance",
        args: [userAddress, bETHAddress],
        chainId: chainId,
    }) 

    const formattenSTETH = stETHConllateral && formatEther(BigInt(stETHConllateral?.toString()))
    const formattenRETH = rETHConllateral && formatEther(BigInt(rETHConllateral?.toString()))
    const formattenBETH = bETHConllateral && formatEther(BigInt(bETHConllateral?.toString()))
    
    const total = Number(formattenSTETH || 0) + Number(formattenRETH || 0) + Number(formattenBETH || 0)
  
    return {
        formattenSTETH,
        formattenRETH,
        formattenBETH,
        total
    }
}