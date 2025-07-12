import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { LiquidityPoolABI } from '@/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/config/wagmi';

export function useLiquidityPool(chainId: number) {
    const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.LiquidityPool;

    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({ hash });

    const deposit = (amount: bigint) => {
        if (!contractAddress) return;

        writeContract({
            address: contractAddress as `0x${string}`,
            abi: LiquidityPoolABI,
            functionName: 'deposit',
            args: [amount],
        });
    };

    const withdraw = (shares: bigint) => {
        if (!contractAddress) return;

        writeContract({
            address: contractAddress as `0x${string}`,
            abi: LiquidityPoolABI,
            functionName: 'withdraw',
            args: [shares],
        });
    };

    return {
        deposit,
        withdraw,
        isPending,
        isConfirming,
        isConfirmed,
        error,
        hash,
    };
}
