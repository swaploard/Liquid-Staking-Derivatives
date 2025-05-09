import { useReadContract, useAccount } from "wagmi";
import CollateralVault from "@/contracts/CollateralVault.json";
import { Address, formatEther } from "viem";

const vaultContract = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS
const rETHAddress = process.env.NEXT_PUBLIC_MOCK_RETH_ADDRESS
const bETHAddress = process.env.NEXT_PUBLIC_MOCK_BETH_ADDRESS
const stETHAddress = process.env.NEXT_PUBLIC_MOCK_STETH_ADDRESS

export const useCollateralOverview = () => {
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

    const { data: stEthToUSD } = useReadContract({
        address: vaultContract as Address,
        abi: CollateralVault.abi,
        functionName: "getCollateralValueInUSD",
        args: [stETHAddress, stETHConllateral],
        chainId: chainId
    })

    const { data: rETHToUSD } = useReadContract({
        address: vaultContract as Address,
        abi: CollateralVault.abi,
        functionName: "getCollateralValueInUSD",
        args: [rETHAddress, rETHConllateral],
        chainId: chainId
    })

    const { data: bETHToUSD } = useReadContract({
        address: vaultContract as Address,
        abi: CollateralVault.abi,
        functionName: "getCollateralValueInUSD",
        args: [bETHAddress, bETHConllateral],
        chainId: chainId
    })

    const formattenSTETH = stETHConllateral && formatEther(BigInt(stETHConllateral?.toString()))
    const formattenRETH = rETHConllateral && formatEther(BigInt(rETHConllateral?.toString()))
    const formattenBETH = bETHConllateral && formatEther(BigInt(bETHConllateral?.toString()))

    const total = Number(stEthToUSD || 0) + Number(rETHToUSD || 0) + Number(bETHToUSD || 0)

    return {
        formattenSTETH,
        formattenRETH,
        formattenBETH,
        total
    }
}

export const useBorrowOverview = () => {
    const { address: userAddress, chainId } = useAccount();

    const { data: BorrowableLimit } = useReadContract({
        address: vaultContract as Address,
        abi: CollateralVault.abi,
        functionName: "calculateMaxBorrowable",
        args: [userAddress],
        chainId: chainId,
    })

    const { data: bETHToUSD } = useReadContract({
        address: vaultContract as Address,
        abi: CollateralVault.abi,
        functionName: "getCollateralValueInUSD",
        args: [stETHAddress, BorrowableLimit],
        chainId: chainId
    })

    const { data: borrowedAmount } = useReadContract({
        address: vaultContract as Address,
        abi: CollateralVault.abi,
        functionName: "getBorrowedAmount",
        args: [userAddress],
        chainId: chainId
    })

    const { data: borrowedAmountInEth } = useReadContract({
        address: vaultContract as Address,
        abi: CollateralVault.abi,
        functionName: "getCollateralValueInUSD",
        args: [stETHAddress, borrowedAmount],
        chainId: chainId
    })

    const formattenBorrowableLimit = Number(bETHToUSD)
    const formattenBorrowedAmount = Number(borrowedAmountInEth);
    const borrowedPercentage = (Number(formattenBorrowedAmount) / formattenBorrowableLimit) * 100

    
    typeof formattenBorrowableLimit === "number" ? (formattenBorrowableLimit % 1 === 0 ? formattenBorrowableLimit.toFixed(0) : formattenBorrowableLimit.toFixed(4)) : 0
    return {
        formattenBorrowableLimit,
        formattenBorrowedAmount,
        borrowedPercentage
    }
}