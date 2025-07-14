# 🚀 Sponsor Technology Integrations

TrustBank demonstrates cutting-edge Web3 infrastructure by integrating three key sponsor technologies:

## 🔍 Goldsky - Real-Time Trust Analytics

**Purpose**: Index TrustBank events and provide real-time trust network analytics

### Features Implemented:

- **GraphQL Subgraph** for trust network data
- **Real-time subscriptions** for live trust score updates
- **Trust score calculations** with payment history, vouches, and loan repayments
- **Network analytics** showing vouching relationships and credit flow

### Setup:

```bash
# 1. Deploy contracts and get event data flowing
npx hardhat deploy --network etherlink

# 2. Set up Goldsky subgraph
# Upload schema.graphql to Goldsky dashboard
# Configure indexing for TrustBankCore events

# 3. Configure frontend
NEXT_PUBLIC_GOLDSKY_ENDPOINT=https://api.goldsky.com/api/public/project_clxxx/subgraphs/trustbank/prod/gn
```

### Integration Code:

```typescript
// Real-time trust network data
const trustData = await getUserTrustNetwork(userAddress);
const analytics = await getTrustNetworkAnalytics();

// Live trust score calculation
const trustScore = calculateTrustScore(
  paymentCount,
  vouchScore,
  loanRepaymentScore,
  accountAge,
  zkBoosts
);
```

## 🎮 Sequence - Gasless Smart Wallets

**Purpose**: Enable true "Venmo-like" UX with gasless transactions and social login

### Features Implemented:

- **Account abstraction** with gasless transactions
- **Social login** via email/username (no seed phrases)
- **Sponsored transactions** for payments, vouching, and loan operations
- **Smart wallet integration** with TrustBank contracts

### Setup:

```bash
# 1. Get Sequence Project Access Key
# Sign up at sequence.app and create project

# 2. Configure for Etherlink
NEXT_PUBLIC_SEQUENCE_PROJECT_ACCESS_KEY=your_access_key

# 3. Enable gasless transactions
# Fund the relayer for transaction sponsorship
```

### Integration Code:

```typescript
// Gasless payment
await trustBankSequence.sendGaslessPayment(
  recipient,
  amount,
  message,
  usdcAddress,
  trustBankCoreAddress
);

// Gasless vouching
await trustBankSequence.vouchForUserGasless(
  vouchee,
  amount,
  trustBankCoreAddress
);

// Social login
const result = await connectWithSequence();
```

## 🔮 RedStone - Decentralized Price Feeds

**Purpose**: Optimize yield strategies with real-time DeFi pricing data

### Features Implemented:

- **Asset pricing** for cross-chain tokens
- **DeFi yield optimization** with live APY data
- **Risk-adjusted allocations** across protocols
- **Automated strategy selection** based on market conditions

### Setup:

```bash
# 1. Deploy TrustBankPriceOracle contract
npx hardhat deploy --network etherlink

# 2. Configure RedStone data feeds
# Set up authorized price updaters
# Connect to RedStone API for live data

# 3. Enable yield optimization
REDSTONE_API_KEY=your_api_key
```

### Integration Code:

```typescript
// Get optimal yield strategy
const (bestStrategy, expectedAPY) = await priceOracle.getOptimalYieldStrategy(
  minAPY, maxRisk
);

// Diversified allocation
const (strategies, allocations) = await priceOracle.getOptimalAllocation(
  totalAmount
);

// Real-time pricing
const usdcPrice = await priceOracle.getAssetPrice("USDC");
const aaveAPY = await priceOracle.getYieldAPY("AAVE_USDC");
```

## 🎯 Demo Flow with All Integrations

**Perfect 5-minute hackathon demonstration:**

### 1. **Seamless Onboard** (Sequence)

```
User clicks "Login with Email" → No seed phrases → Gasless wallet created
```

### 2. **Smart Payment** (Sequence + Goldsky)

```
Send $25 gaslessly → Real-time trust score update via Goldsky analytics
```

### 3. **Intelligent Vouching** (Goldsky)

```
Friend vouches → Goldsky predicts credit boost → Trust network visualization
```

### 4. **Auto-Yield Optimization** (RedStone)

```
Deposit $100 → RedStone finds best yield (6.2% vs 5.5% static)
```

### 5. **Instant Decentralized Credit**

```
Pure on-chain scoring → $200 loan approved in 10 seconds → No traditional credit needed
```

### 6. **Gasless Repayment** (Sequence + Goldsky)

```
Repay via Sequence → Live trust score update → Increased credit limit
```

## 📊 Technical Architecture

```
Frontend (Next.js + React)
    ↓
Sequence SDK (Gasless UX)
    ↓
TrustBank Smart Contracts (Etherlink)
    ↓
Goldsky Indexing (Real-time Analytics)
    ↓
RedStone Oracles (Yield Optimization)
```

## 🔧 Development Setup

### Prerequisites:

```bash
npm install @sequence-kit/wallet @apollo/client graphql
```

### Contract Deployment:

```bash
# Deploy all contracts including new PriceOracle
npx hardhat ignition deploy ./ignition/modules/TrustBank.ts --network etherlink

# Verify contracts
npx hardhat verify --network etherlink [CONTRACT_ADDRESS]
```

### Frontend Integration:

```bash
cd frontend
npm install
npm run dev
```

## 🚀 Why This Integration Works

**Not forced integrations** → Each solves a real TrustBank need:

1. **Goldsky**: Trust networks need real-time analytics for credit decisions
2. **Sequence**: Banking needs mainstream UX to achieve mass adoption
3. **RedStone**: Yield strategies need accurate, live pricing data

**Result**: A complete decentralized banking infrastructure that showcases the future of Web3 UX while maintaining full decentralization.

## 🎪 Hackathon Judging Points

- ✅ **Technical Innovation**: Real-time trust scoring with ZK privacy
- ✅ **User Experience**: Gasless transactions + social login
- ✅ **Market Opportunity**: Addresses 0.1% → 10% DeFi adoption gap
- ✅ **Sponsor Integration**: Thoughtful use of cutting-edge infrastructure
- ✅ **Scalability**: Built for millions of users, not just crypto natives

**This demonstrates TrustBank as the first complete decentralized banking solution ready for mainstream adoption! 🏆**
