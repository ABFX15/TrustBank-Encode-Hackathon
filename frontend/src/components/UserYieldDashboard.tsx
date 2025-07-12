import { useAccount } from "wagmi";
import { useYieldStrategy } from "@/hooks/useYieldStrategy";
import { etherlinkTestnet } from "@/config/wagmi";

export function UserYieldDashboard() {
  const { address } = useAccount();
  const chainId = etherlinkTestnet.id;
  const { userYieldBalance, currentAPY, isLoading, error } = useYieldStrategy(
    chainId,
    address as `0x${string}`
  );

  return (
    <div className="card-premium p-6">
      <h3 className="text-xl font-semibold text-cyan-400 mb-4 font-tech">
        Your Yield & Staking Returns
      </h3>
      {isLoading ? (
        <div className="text-gray-400">Loading your returns...</div>
      ) : error ? (
        <div className="text-red-400">Error loading yield data</div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Total Balance (incl. yield)</span>
            <span className="text-white font-mono">
              {userYieldBalance
                ? `${Number(userYieldBalance) / 1e18} USDC`
                : "0.00 USDC"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Current APY</span>
            <span className="text-cyan-400 font-mono">
              {currentAPY
                ? `${(Number(currentAPY) / 1e16).toFixed(2)}%`
                : "0.00%"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
