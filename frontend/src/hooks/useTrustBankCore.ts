import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { TrustBankCoreABI } from '@/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/config/wagmi';

export function useTrustBankCore(chainId: number, userAddress?: `0x${string}`) {
    const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.TrustBankCore;

    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({ hash });

    // Read functions
    const { data: userTrustScore } = useReadContract({
        address: contractAddress as `0x${string}`,
        abi: TrustBankCoreABI,
        functionName: 'getUserTrustScore',
        args: userAddress ? [userAddress] : undefined,
        query: { enabled: !!userAddress && !!contractAddress },
    });

    const { data: totalTrustScore } = useReadContract({
        address: contractAddress as `0x${string}`,
        abi: TrustBankCoreABI,
        functionName: 'getTotalTrustScore',
        args: userAddress ? [userAddress] : undefined,
        query: { enabled: !!userAddress && !!contractAddress },
    });

    const vouchFor = (vouchee: `0x${string}`, amount: bigint) => {
        if (!contractAddress) return;

        writeContract({
            address: contractAddress as `0x${string}`,
            abi: TrustBankCoreABI,
            functionName: 'vouchForUser',
            args: [vouchee, amount],
        });
    };

    const makePayment = (recipient: `0x${string}`, amount: bigint, message: string) => {
        if (!contractAddress) return;

        writeContract({
            address: contractAddress as `0x${string}`,
            abi: TrustBankCoreABI,
            functionName: 'sendPayment',
            args: [recipient, amount, message],
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
        userTrustScore,
        totalTrustScore,
    };
}
