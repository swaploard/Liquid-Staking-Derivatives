import { useReadContract, useAccount, useWatchContractEvent } from "wagmi";
import CollateralVault from "@/contracts/CollateralVault.json";
import { Address, formatEther } from "viem";
import { vaultStore } from "@/store/valutStore";
import { useEffect, useState } from "react";
const vaultContract = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS
const rETHAddress = process.env.NEXT_PUBLIC_MOCK_RETH_ADDRESS
const bETHAddress = process.env.NEXT_PUBLIC_MOCK_BETH_ADDRESS
const stETHAddress = process.env.NEXT_PUBLIC_MOCK_STETH_ADDRESS

export const useCollateralOverview = () => {
    const { setCollateralData } = vaultStore()
    const { address: userAddress, chainId } = useAccount();
    const [eventData, setEventData] = useState<any>()

    const { data: stETHConllateral, refetch: refetchstETHAddress } = useReadContract({
        address: vaultContract as Address,
        abi: CollateralVault.abi,
        functionName: "getCollateralBalance",
        args: [userAddress, stETHAddress],
        chainId: chainId,
    })

    const { data: rETHConllateral, refetch: refetchrETHAddress } = useReadContract({
        address: vaultContract as Address,
        abi: CollateralVault.abi,
        functionName: "getCollateralBalance",
        args: [userAddress, rETHAddress],
        chainId: chainId,
    })

    const { data: bETHConllateral, refetch: refetchbETHAddress } = useReadContract({
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

    useEffect(() => {
        refetchstETHAddress()
        refetchrETHAddress()
        refetchbETHAddress()
    }, [eventData])

    useEffect(() => {
        setCollateralData(
            Number(formattenSTETH),
            Number(formattenRETH),
            Number(formattenBETH),
            total
        )
    }, [formattenSTETH, formattenRETH, formattenBETH, total])

    useWatchContractEvent({
        address: vaultContract as Address,
        abi: CollateralVault.abi,
        eventName: 'CollateralDeposited',
        onLogs: (log) => {
            setEventData(log)
        },
        chainId: chainId
    });

    useWatchContractEvent({
        address: vaultContract as Address,
        abi: CollateralVault.abi,
        eventName: 'CollateralWithdrawn',
        onLogs: (log) => {
            setEventData(log)
        },
        chainId: chainId
    });

    useWatchContractEvent({
        address: vaultContract as Address,
        abi: CollateralVault.abi,
        eventName: 'StablecoinBorrowed',
        onLogs: (log) => {
            setEventData(log)
        },
        chainId: chainId
    });

    useWatchContractEvent({
        address: vaultContract as Address,
        abi: CollateralVault.abi,
        eventName: 'StablecoinRepaid',
        onLogs: (log) => {
            setEventData(log)
        },
        chainId: chainId
    });
    return {
        formattenSTETH,
        formattenRETH,
        formattenBETH,
        total
    }

}

export const useBorrowOverview = () => {
    const { setBorrowedInfo } = vaultStore()
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


    const { data: helthFactor } = useReadContract({
        address: vaultContract as Address,
        abi: CollateralVault.abi,
        functionName: "calculateHealthFactor",
        args: [userAddress],
        chainId: chainId
    })

    const formattenBorrowableLimit = Number(bETHToUSD) - Number(borrowedAmount)
    const borrowedPercentage = (Number(borrowedAmount) / formattenBorrowableLimit) * 100

    useEffect(() => {
        setBorrowedInfo(
            Number(formattenBorrowableLimit),
            Number(bETHToUSD),
            Number(helthFactor),
            Number(borrowedAmount)
        )
    }, [formattenBorrowableLimit, bETHToUSD, helthFactor, borrowedAmount])

    typeof formattenBorrowableLimit === "number" ? (formattenBorrowableLimit % 1 === 0 ? formattenBorrowableLimit.toFixed(0) : formattenBorrowableLimit.toFixed(4)) : 0
    return {
        formattenBorrowableLimit,
        borrowedAmount,
        borrowedPercentage,
        helthFactor
    }
}