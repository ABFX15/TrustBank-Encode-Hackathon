import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { TrustBankCoreABI } from '@/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/config/wagmi';

export function useTrustBankCore(chainId: number) {
    const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.TrustBankCore;

    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({ hash });

    const vouchFor = (vouchee: string, amount: bigint) => {
        if (!contractAddress) return;

        writeContract({
            address: contractAddress as `0x${string}`,
            abi: TrustBankCoreABI,
            functionName: 'vouchFor',
            args: [vouchee, amount],
        });
    };

    const makePayment = (recipient: string, amount: bigint) => {
        if (!contractAddress) return;

        writeContract({
            address: contractAddress as `0x${string}`,
            abi: TrustBankCoreABI,
            functionName: 'makePayment',
            args: [recipient, amount],
        });
    };

    return {
        vouchFor,
        makePayment,
        isPending,
        isConfirming,
        isConfirmed,
        error,
        hash,
    };
}
