import { useReadContract } from 'wagmi';
import { YieldStrategyABI } from '@/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/config/wagmi';

export function useYieldStrategy(chainId: number, userAddress?: `0x${string}`) {
    const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.YieldStrategy;

    // Read user's yield balance
    const { data: userYieldBalance, isLoading, error } = useReadContract({
        address: contractAddress as `0x${string}`,
        abi: YieldStrategyABI,
        functionName: 'getUserBalance',
        args: userAddress ? [userAddress] : undefined,
        query: { enabled: !!userAddress && !!contractAddress },
    });

    // Read current APY
    const { data: currentAPY } = useReadContract({
        address: contractAddress as `0x${string}`,
        abi: YieldStrategyABI,
        functionName: 'getCurrentAPY',
        args: [],
        query: { enabled: !!contractAddress },
    });

    return {
        userYieldBalance,
        currentAPY,
        isLoading,
        error,
    };
}
