import { useWriteContract, usePublicClient } from "wagmi";
import { Address } from "viem";
import CollateralVault from "@/contracts/CollateralVault.json";
import { Step, StepStatus } from "@/types";

const vaultContract = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS

interface useDepositCollateralProps {
    setSteps: React.Dispatch<React.SetStateAction<Step[]>>
    setShowStepper: React.Dispatch<React.SetStateAction<boolean>>
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
}

export const useDepositCollateral = ({ setSteps, setShowStepper, setIsLoading }: useDepositCollateralProps) => {
    const { writeContract } = useWriteContract()
    const publicClient = usePublicClient()
    const updateStepStatus = (stepIndex: number, newStatus: StepStatus) => {
        setSteps((prev) =>
            prev.map((step, index) =>
                index === stepIndex ? { ...step, status: newStatus } : step
            )
        );
    };

    const depositCollateral = (token: Address, amount: bigint) => {
        updateStepStatus(0, "current")
        setShowStepper(true)
        setIsLoading(true)
        writeContract({
            address: vaultContract as Address,
            abi: CollateralVault.abi,
            functionName: "depositCollateral",
            args: [token, BigInt(amount)],
        },
            {
                onSuccess: async (txHash) => {
                    updateStepStatus(0, "completed")
                    updateStepStatus(1, "current")
                    const receipt = await publicClient?.waitForTransactionReceipt({
                        hash: txHash,
                    });
                    if (receipt?.status.toLowerCase() === 'success') {
                        updateStepStatus(1, "current")
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

    return { depositCollateral }
}