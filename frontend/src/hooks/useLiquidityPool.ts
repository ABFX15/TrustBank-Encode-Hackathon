import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { LiquidityPoolABI } from '@/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/config/wagmi';

export function useLiquidityPool(chainId: number, userAddress?: `0x${string}`) {
    const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.LiquidityPool;

    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({ hash });

    // Read functions
    const { data: userBalance } = useReadContract({
        address: contractAddress as `0x${string}`,
        abi: LiquidityPoolABI,
        functionName: 'balanceOf',
        args: userAddress ? [userAddress] : undefined,
        query: { enabled: !!userAddress && !!contractAddress },
    });

    const { data: totalSupply } = useReadContract({
        address: contractAddress as `0x${string}`,
        abi: LiquidityPoolABI,
        functionName: 'totalSupply',
        args: [],
        query: { enabled: !!contractAddress },
    });

    const deposit = (amount: bigint) => {
        if (!contractAddress) return;

        writeContract({
            address: contractAddress as `0x${string}`,
            abi: LiquidityPoolABI,
            functionName: 'addLiquidity',
            args: [amount],
        });
    };

    const withdraw = (lpTokenAmount: bigint) => {
        if (!contractAddress) return;

        writeContract({
            address: contractAddress as `0x${string}`,
            abi: LiquidityPoolABI,
            functionName: 'removeLiquidity',
            args: [lpTokenAmount],
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
        userBalance,
        totalSupply,
    };
}
