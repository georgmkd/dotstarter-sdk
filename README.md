# dotstarter-sdk

A TypeScript SDK for interacting with Polkadot and Substrate-based blockchains. This SDK provides a unified, developer-friendly interface for wallet management, transfers, staking, governance, and more.

## Features

- 🔗 **Chain Connection**: Connect to any Polkadot/Substrate node
- 👛 **Wallet Management**: Support for Polkadot.js and Talisman extensions
- 💸 **Transfers**: Send DOT/KSM and other native tokens
- 🏛️ **Staking**: Bond, nominate, and manage staking operations
- 🗳️ **Governance**: Vote on referenda and treasury proposals
- 📡 **Real-time Events**: Subscribe to blockchain events
- 🔧 **TypeScript**: Full type safety and IntelliSense support

## Installation

```bash
npm install dotstarter-sdk
```

## Quick Start

```typescript
import { DotStarter } from "dotstarter-sdk";

// Initialize the SDK
const dot = new DotStarter({ 
  provider: "wss://rpc.polkadot.io" 
});

// Connect to the blockchain
await dot.connect();

// Get wallet accounts
const accounts = await dot.wallet.getAccounts();

// Check balance
const balance = await dot.wallet.getBalance("5Fb...xyz");
console.log(`Balance: ${balance.formatted}`);

// Send a transfer
const result = await dot.tx.transfer("5Fb...xyz", "5Fz...abc", 1.5);
console.log(`Transaction hash: ${result.hash}`);
```

## API Reference

### Configuration

```typescript
interface DotStarterConfig {
  provider?: string;      // WebSocket endpoint (default: Polkadot mainnet)
  network?: NetworkName;  // Network name for automatic configuration
  timeout?: number;       // Connection timeout in ms
}
```

### Supported Networks

```typescript
const networks = {
  polkadot: 'wss://rpc.polkadot.io',
  kusama: 'wss://kusama-rpc.polkadot.io',
  westend: 'wss://westend-rpc.polkadot.io',
  rococo: 'wss://rococo-rpc.polkadot.io',
};
```

### Connection Management

```typescript
// Connect to blockchain
await dot.connect();

// Check connection status
const isConnected = dot.isConnected();

// Get chain information
const chainInfo = await dot.getChainInfo();

// Disconnect
await dot.disconnect();
```

### Wallet Operations

```typescript
// Get all available accounts
const accounts = await dot.wallet.getAccounts();

// Get account balance
const balance = await dot.wallet.getBalance(address);

// Check if wallet extensions are available
const hasWallets = dot.wallet.hasExtensions();

// Get extension names
const extensions = dot.wallet.getExtensionNames();
```

### Transfers

```typescript
// Simple transfer
const result = await dot.tx.transfer(fromAddress, toAddress, amount);

// Transfer with options
const result = await dot.tx.transferWithOptions({
  from: "5Fb...xyz",
  to: "5Fz...abc", 
  amount: 1.5,
  tip: 0.01
});
```

### Staking

```typescript
// Get staking information
const stakingInfo = await dot.staking.getStakingInfo(address);

// Bond tokens for staking
const hash = await dot.staking.bond(stashAccount, controllerAccount, amount);

// Nominate validators
const validators = ["5Validator1...", "5Validator2..."];
const hash = await dot.staking.nominate(controllerAccount, validators);

// Unbond tokens
const hash = await dot.staking.unbond(controllerAccount, amount);

// Withdraw unbonded tokens
const hash = await dot.staking.withdrawUnbonded(stashAccount);

// Get all active validators
const validators = await dot.staking.getValidators();
```

### Governance

```typescript
// Get active proposals
const proposals = await dot.governance.getActiveProposals();

// Vote on a referendum
const hash = await dot.governance.vote(
  account, 
  referendumIndex, 
  'aye',    // or 'nay'
  1,        // conviction multiplier
  amount    // vote amount
);

// Get referendum details
const details = await dot.governance.getReferendumDetails(referendumIndex);

// Submit treasury proposal
const hash = await dot.governance.submitTreasuryProposal(
  account, 
  requestAmount, 
  beneficiaryAddress
);
```

### Event Subscription

```typescript
// Subscribe to all blockchain events
const subscription = await dot.events.subscribe((events) => {
  events.forEach(event => {
    console.log('Event:', event.event);
  });
});

// Get current block number
const blockNumber = await dot.events.getCurrentBlockNumber();

// Get block hash
const hash = await dot.events.getBlockHash(blockNumber);

// Unsubscribe
subscription.unsubscribe();
```

## Error Handling

The SDK provides detailed error messages for common issues:

```typescript
try {
  await dot.connect();
} catch (error) {
  if (error.message.includes('wallet extensions')) {
    console.log('Please install Polkadot.js or Talisman extension');
  }
}

try {
  const result = await dot.tx.transfer(from, to, amount);
} catch (error) {
  console.log('Transfer failed:', error.message);
}
```

## Type Definitions

The SDK exports comprehensive TypeScript types:

```typescript
import type { 
  DotStarterConfig,
  WalletAccount,
  Balance,
  TransferResult,
  StakingInfo,
  GovernanceProposal,
  ChainInfo
} from 'dotstarter-sdk';
```

## Examples

### Basic Wallet Integration

```typescript
import { DotStarter } from "dotstarter-sdk";

async function setupWallet() {
  const dot = new DotStarter();
  await dot.connect();
  
  const accounts = await dot.wallet.getAccounts();
  
  for (const account of accounts) {
    const balance = await dot.wallet.getBalance(account.address);
    console.log(`${account.name}: ${balance.formatted}`);
  }
}
```

### Staking Workflow

```typescript
async function stakingWorkflow() {
  const dot = new DotStarter();
  await dot.connect();
  
  const stashAccount = "5StashAccount...";
  const controllerAccount = "5ControllerAccount...";
  
  // Bond initial amount
  await dot.staking.bond(stashAccount, controllerAccount, 10);
  
  // Get validators and nominate top 5
  const validators = await dot.staking.getValidators();
  await dot.staking.nominate(controllerAccount, validators.slice(0, 5));
  
  // Check staking info
  const stakingInfo = await dot.staking.getStakingInfo(stashAccount);
  console.log('Bonded amount:', stakingInfo.bonded);
}
```

### Event Monitoring

```typescript
async function monitorEvents() {
  const dot = new DotStarter();
  await dot.connect();
  
  await dot.events.subscribe((events) => {
    events.forEach(({ event }) => {
      if (event.section === 'balances' && event.method === 'Transfer') {
        console.log('Transfer detected:', event.data);
      }
    });
  });
}
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm run test
```

### Type Checking

```bash
npm run type-check
```

## Roadmap

- **Phase 2**: CLI tool for scaffolding dApps
- **Phase 3**: REST API wrapper
- **Phase 4**: Parachain-specific integrations (Moonbeam, Astar, etc.)
- **Phase 5**: Advanced features (multi-signature, batch transactions)

## Acknowledgments

Built with:
- [@polkadot/api](https://github.com/polkadot-js/api) - Polkadot API library
- [@polkadot/extension-dapp](https://github.com/polkadot-js/extension) - Wallet integration
- [tsup](https://github.com/egoist/tsup) - TypeScript bundler
