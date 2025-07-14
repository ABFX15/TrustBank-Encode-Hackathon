import { ApolloClient, InMemoryCache, gql, createHttpLink } from '@apollo/client';

// Goldsky subgraph endpoint for TrustBank
const GOLDSKY_ENDPOINT = process.env.NEXT_PUBLIC_GOLDSKY_ENDPOINT || 'https://api.goldsky.com/api/public/project_clxxx/subgraphs/trustbank/prod/gn';

const httpLink = createHttpLink({
    uri: GOLDSKY_ENDPOINT,
});

export const goldskyClient = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
});

// GraphQL queries for TrustBank data
export const GET_USER_TRUST_NETWORK = gql`
  query GetUserTrustNetwork($user: String!) {
    user(id: $user) {
      id
      trustScore
      totalPayments
      totalVouches
      creditBoosts
      loans {
        id
        amount
        status
        createdAt
        repaidAt
      }
      payments(orderBy: timestamp, orderDirection: desc, first: 10) {
        id
        amount
        recipient
        message
        timestamp
        completed
      }
      vouches(where: { active: true }) {
        id
        voucher {
          id
          trustScore
        }
        amount
        timestamp
        active
      }
      receivedVouches: vouches(where: { vouchee: $user, active: true }) {
        id
        voucher {
          id
          trustScore
        }
        amount
        timestamp
      }
    }
  }
`;

export const GET_TRUST_NETWORK_ANALYTICS = gql`
  query GetTrustNetworkAnalytics {
    protocolStats(id: "1") {
      totalUsers
      totalPayments
      totalLoans
      totalVouches
      totalTVL
      averageTrustScore
    }
    topUsers: users(
      orderBy: trustScore
      orderDirection: desc
      first: 10
      where: { trustScore_gt: 0 }
    ) {
      id
      trustScore
      totalPayments
      totalVouches
    }
  }
`;

export const GET_REAL_TIME_TRUST_UPDATES = gql`
  subscription GetRealTimeTrustUpdates($user: String!) {
    user(id: $user) {
      trustScore
      payments(orderBy: timestamp, orderDirection: desc, first: 1) {
        id
        amount
        timestamp
      }
      vouches(orderBy: timestamp, orderDirection: desc, first: 1) {
        id
        amount
        timestamp
      }
    }
  }
`;

export const GET_YIELD_OPTIMIZATION_DATA = gql`
  query GetYieldOptimizationData {
    yieldStrategies(orderBy: currentAPY, orderDirection: desc) {
      id
      name
      protocol
      currentAPY
      totalDeposits
      lastHarvest
    }
    liquidityPools {
      id
      totalDeposits
      availableLiquidity
      yieldEarned
      utilizationRate
    }
  }
`;

// Utility functions for trust network analysis
export async function getUserTrustNetwork(userAddress: string) {
    try {
        const { data } = await goldskyClient.query({
            query: GET_USER_TRUST_NETWORK,
            variables: { user: userAddress.toLowerCase() },
            fetchPolicy: 'cache-first',
        });
        return data.user;
    } catch (error) {
        console.error('Error fetching user trust network:', error);
        return null;
    }
}

export async function getTrustNetworkAnalytics() {
    try {
        const { data } = await goldskyClient.query({
            query: GET_TRUST_NETWORK_ANALYTICS,
            fetchPolicy: 'cache-first',
        });
        return data;
    } catch (error) {
        console.error('Error fetching trust network analytics:', error);
        return null;
    }
}

// Real-time trust score calculator
export function calculateTrustScore(
    paymentCount: number,
    vouchScore: number,
    loanRepaymentScore: number,
    accountAge: number,
    zkBoosts: number = 0
): number {
    const paymentScore = paymentCount * 10; // 40% weight
    const vouchWeight = vouchScore; // 30% weight  
    const repaymentWeight = loanRepaymentScore; // 25% weight
    const ageBonus = Math.min(accountAge, 365) / 365 * 50; // 5% weight, max 1 year

    const baseScore = (
        paymentScore * 0.4 +
        vouchWeight * 0.3 +
        repaymentWeight * 0.25 +
        ageBonus * 0.05
    );

    return Math.floor(baseScore + zkBoosts);
}

// Credit limit calculator
export function calculateMaxLoanAmount(trustScore: number): number {
    const MAX_LOAN = 1000; // $1000 cap
    const calculatedLimit = trustScore * 10; // $10 per trust score point
    return Math.min(calculatedLimit, MAX_LOAN);
} 