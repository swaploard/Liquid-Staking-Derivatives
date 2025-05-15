import { useWriteContract, useAccount, usePublicClient } from "wagmi"
import CollateralVault from "@/contracts/CollateralVault.json";
import { Address } from "viem";
import { Step, StepStatus } from "@/types";

const vaultContract = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS

interface useRepayStableCoinProps {
    setSteps: React.Dispatch<React.SetStateAction<Step[]>>
    setShowStepper: React.Dispatch<React.SetStateAction<boolean>>
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
}

export const useRepayStableCoin = ({ setSteps, setShowStepper, setIsLoading }: useRepayStableCoinProps) => {
    const { writeContract } = useWriteContract()
    const publicClient = usePublicClient()
    const { chainId } = useAccount()

    const updateStepStatus = (stepIndex: number, newStatus: StepStatus) => {
        setSteps((prev) =>
            prev.map((step, index) =>
                index === stepIndex ? { ...step, status: newStatus } : step
            )
        );
    };

    const handleRepayAmount = (amount: number) => {
        updateStepStatus(0, "current")
        setShowStepper(true)
        setIsLoading(true)
        writeContract({
            address: vaultContract as Address,
            abi: CollateralVault.abi,
            functionName: "repay",
            args: [amount],
            chainId: chainId
        }, {
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
        handleRepayAmount
    }
}