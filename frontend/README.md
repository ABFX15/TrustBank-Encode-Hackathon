# TrustBank Frontend

A modern React frontend for the TrustBank protocol built with Next.js, Wagmi, RainbowKit, and Tailwind CSS.

## Features

- 🌈 **RainbowKit Integration**: Beautiful wallet connection UI with support for multiple wallets
- ⚡ **Wagmi v2**: Modern React hooks for Ethereum interactions
- 🎨 **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- 🔗 **Multi-Chain Support**: Built with Etherlink testnet support (easily extendable)
- 📱 **Responsive Design**: Mobile-first responsive design
- 🎯 **TypeScript**: Full type safety throughout the application

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- A wallet (MetaMask, WalletConnect, etc.)
- Some test ETH on Etherlink testnet

### Installation

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Create environment file:

   ```bash
   cp .env.local.example .env.local
   ```

4. Update environment variables in `.env.local`:

   ```env
   # Get your project ID from https://cloud.walletconnect.com/
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

   # Contract addresses (update after deployment)
   NEXT_PUBLIC_MOCKUSDC_ADDRESS=0x...
   NEXT_PUBLIC_TRUSTBANK_CORE_ADDRESS=0x...
   NEXT_PUBLIC_CREDIT_ENGINE_ADDRESS=0x...
   # ... other contract addresses
   ```

5. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Setup WalletConnect

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy the Project ID
4. Add it to your `.env.local` file as `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

## Updating Contract Addresses

After deploying contracts to Etherlink testnet:

1. Copy the contract addresses from the deployment output
2. Update the `CONTRACT_ADDRESSES` object in `src/config/wagmi.ts`
3. Update the environment variables in `.env.local`

Example:

```typescript
export const CONTRACT_ADDRESSES = {
  [etherlinkTestnet.id]: {
    MockUSDC: "0x1234567890123456789012345678901234567890",
    TrustBankCore: "0x2345678901234567890123456789012345678901",
    // ... other addresses
  },
};
```

## Contract ABIs

The contract ABIs need to be updated after compilation:

1. Run `npm run compile` in the main project directory
2. Copy the ABIs from `artifacts/contracts/` to `src/contracts/abis.ts`
3. Update the ABI arrays in the file

## Features Overview

### Core Components

- **Header**: Navigation with wallet connection
- **LendingInterface**: Deposit and borrow USDC
- **TrustNetwork**: Manage trust connections and vouching
- **StatsOverview**: Protocol statistics dashboard

### Hooks

- **useTrustBankCore**: Interact with the core trust contract
- **useLiquidityPool**: Manage deposits and withdrawals
- **useCreditEngine**: Handle borrowing and lending

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Network Configuration

The app is configured for Etherlink testnet by default. To add more networks:

1. Update `src/config/wagmi.ts`
2. Add the new chain configuration
3. Update the `CONTRACT_ADDRESSES` object

## Troubleshooting

### Common Issues

1. **Wallet not connecting**: Check that you have the correct network (Etherlink testnet) selected
2. **Contract calls failing**: Ensure contract addresses are correct and you have test ETH
3. **WalletConnect issues**: Verify your Project ID is correct

### Getting Test ETH

For Etherlink testnet, you'll need test ETH. Check the Etherlink documentation for faucet information.

## Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Test on both desktop and mobile
4. Update documentation for new features

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- AWS Amplify
- Firebase Hosting
- Docker

## License

This project is part of the TrustBank protocol.
