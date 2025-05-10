import { useWriteContract, useAccount, useReadContract, usePublicClient } from "wagmi"
import CollateralVault from "@/contracts/CollateralVault.json";
import { Address, formatEther } from "viem";
import { Step, StepStatus } from "@/types";
import { usdToWei } from "@/utils/conversions"
import { useEffect, useState } from "react";
const vaultContract = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS
const stETHAddress = process.env.NEXT_PUBLIC_MOCK_STETH_ADDRESS

interface useBorrowStablecoinProps {
    setSteps: React.Dispatch<React.SetStateAction<Step[]>>
    setShowStepper: React.Dispatch<React.SetStateAction<boolean>>
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
}

export const useBorrowStablecoin = ({ setSteps, setShowStepper, setIsLoading }: useBorrowStablecoinProps) => {
    const { writeContract } = useWriteContract()
    const publicClient = usePublicClient()
    const { chainId, address: userAddress } = useAccount();
    const [formattenBorrowedAmount, setFormattenBorrowedAmount] = useState<number>(0)

    const updateStepStatus = (stepIndex: number, newStatus: StepStatus) => {
        setSteps((prev) =>
            prev.map((step, index) =>
                index === stepIndex ? { ...step, status: newStatus } : step
            )
        );
    };
    
    const { data: BorrowableLimit } = useReadContract({
        address: vaultContract as Address,
        abi: CollateralVault.abi,
        functionName: "calculateMaxBorrowable",
        args: [userAddress],
        chainId: chainId,
    })

    const { data: BorrowableLimitUSD } = useReadContract({
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

    useEffect(() => {
        if (borrowedAmount) {
            const borrowedAmountInEth = formatEther(borrowedAmount as bigint)
            const borrowedAmountInNumber = Number(borrowedAmountInEth)
            setFormattenBorrowedAmount(borrowedAmountInNumber)
        }
    }, [borrowedAmount])

    
    const handleBorrowing = async (amount: number) => {
        updateStepStatus(0, "current")
        setShowStepper(true)
        setIsLoading(true)
        writeContract({
            address: vaultContract as Address,
            abi: CollateralVault.abi,
            functionName: "borrowStablecoin",
            args: [amount],
            chainId: chainId
        },{
            onSuccess: async (txHash) => {
                updateStepStatus(0, "completed")
                updateStepStatus(1, "current")
                const receipt = await publicClient?.waitForTransactionReceipt({
                    hash: txHash,
                });
                if (receipt?.status.toLowerCase() === 'success') {
                    updateStepStatus(1, "completed")
                    setShowStepper(false)
                    setIsLoading(false)
                } else {
                    setShowStepper(false)
                    setIsLoading(false)
                }
            },
            onError: (err) => {
                setShowStepper(false)
                setIsLoading(false)
                console.log(err)
            }
        })
    }
   
    return {
        handleBorrowing,
        BorrowableLimitUSD,
        formattenBorrowedAmount
    }
}