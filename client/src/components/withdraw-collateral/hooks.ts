import { useWriteContract, useAccount, useReadContract, usePublicClient } from "wagmi"
import CollateralVault from "@/contracts/CollateralVault.json";
import { Address } from "viem";
import { Step, StepStatus } from "@/types";

const vaultContract = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS

interface useWithdrawCollateralProps {
    setSteps: React.Dispatch<React.SetStateAction<Step[]>>
    setShowStepper: React.Dispatch<React.SetStateAction<boolean>>
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
    setAmount: React.Dispatch<React.SetStateAction<string>>
}
export const useWithdrawCollateral = ({ setSteps, setShowStepper, setIsLoading , setAmount}: useWithdrawCollateralProps) => {
    const publicClient = usePublicClient()
    const { writeContract } = useWriteContract()   
    const { chainId, address: userAddress } = useAccount();

    const updateStepStatus = (stepIndex: number, newStatus: StepStatus) => {
        setSteps((prev) =>
            prev.map((step, index) =>
                index === stepIndex ? { ...step, status: newStatus } : step
            )
        );
    };
    const handleWithdrawCollateral = async (amount: bigint, token: string) => {
       updateStepStatus(0, "current")
        setShowStepper(true)
        setIsLoading(true)
        writeContract({
            address: vaultContract as Address,
            abi: CollateralVault.abi,
            functionName: "withdrawCollateral",
            args: [token, amount],
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
                    setAmount("")
                } else {
                    setShowStepper(false)
                    setIsLoading(false)
                    setAmount("")
                }
            },
            onError: (err) => {
                setShowStepper(false)
                setIsLoading(false)
                setAmount("")
                console.log(err)
            }
        }) 
    }

    return{
        handleWithdrawCollateral
    }
}