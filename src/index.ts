import { ChainManager } from './chain';
import { WalletManager } from './wallet';
import { StakingManager } from './staking';
import { GovernanceManager } from './governance';
import type { 
  DotStarterConfig, 
  WalletAccount, 
  Balance, 
  TransferOptions, 
  TransferResult,
  StakingInfo,
  GovernanceProposal,
  ChainInfo,
  EventSubscription,
  EventCallback,
} from './types';
import type { NetworkName } from './utils/constants';
import { WELL_KNOWN_ENDPOINTS, DEFAULT_NETWORK } from './utils/constants';

/**
 * Main DotStarter SDK class
 * Provides a unified interface for interacting with Polkadot/Substrate chains
 */
export class DotStarter {
  private chainManager: ChainManager;
  private walletManager?: WalletManager;
  private stakingManager?: StakingManager;
  private governanceManager?: GovernanceManager;
  private config: Required<DotStarterConfig>;

  constructor(config: DotStarterConfig = {}) {
    this.config = {
      provider: config.provider || WELL_KNOWN_ENDPOINTS[DEFAULT_NETWORK],
      network: config.network || DEFAULT_NETWORK,
      timeout: config.timeout || 30000,
    };

    this.chainManager = new ChainManager(this.config.provider, this.config.network);
  }

  /**
   * Connect to the blockchain and initialize all managers
   */
  async connect(): Promise<void> {
    const api = await this.chainManager.connect();
    
    // Initialize managers with the connected API
    this.walletManager = new WalletManager(api);
    this.stakingManager = new StakingManager(api);
    this.governanceManager = new GovernanceManager(api);

    // Initialize wallet extensions
    try {
      await this.walletManager.initialize();
    } catch (error) {
      console.warn('Failed to initialize wallet extensions:', error);
    }
  }

  /**
   * Disconnect from the blockchain
   */
  async disconnect(): Promise<void> {
    await this.chainManager.disconnect();
  }

  /**
   * Check if connected to the blockchain
   */
  isConnected(): boolean {
    return this.chainManager.isConnected();
  }

  /**
   * Get chain information
   */
  async getChainInfo(): Promise<ChainInfo> {
    return this.chainManager.getChainInfo();
  }

  // Wallet-related methods
  get wallet() {
    if (!this.walletManager) {
      throw new Error('SDK not connected. Call connect() first.');
    }

    return {
      /**
       * Get all available wallet accounts
       */
      getAccounts: (): Promise<WalletAccount[]> => this.walletManager!.getAccounts(),

      /**
       * Get balance for a specific address
       */
      getBalance: (address: string): Promise<Balance> => this.walletManager!.getBalance(address),

      /**
       * Check if wallet extensions are available
       */
      hasExtensions: (): boolean => this.walletManager!.hasExtensions(),

      /**
       * Get available extension names
       */
      getExtensionNames: (): string[] => this.walletManager!.getExtensionNames(),
    };
  }

  // Transaction-related methods
  get tx() {
    if (!this.walletManager || !this.chainManager) {
      throw new Error('SDK not connected. Call connect() first.');
    }

    return {
      /**
       * Send a transfer transaction
       */
      transfer: async (from: string, to: string, amount: string | number): Promise<TransferResult> => {
        const signer = await this.walletManager!.getSigner(from);
        const options: TransferOptions = { from, to, amount };
        return this.chainManager.transfer(options, signer);
      },

      /**
       * Send a transfer with custom options
       */
      transferWithOptions: async (options: TransferOptions): Promise<TransferResult> => {
        const signer = await this.walletManager!.getSigner(options.from);
        return this.chainManager.transfer(options, signer);
      },
    };
  }

  // Staking-related methods
  get staking() {
    if (!this.stakingManager || !this.walletManager) {
      throw new Error('SDK not connected. Call connect() first.');
    }

    return {
      /**
       * Get staking information for an account
       */
      getStakingInfo: (address: string): Promise<StakingInfo> => 
        this.stakingManager!.getStakingInfo(address),

      /**
       * Bond tokens for staking
       */
      bond: async (stashAccount: string, controllerAccount: string, amount: string | number): Promise<string> => {
        const signer = await this.walletManager!.getSigner(stashAccount);
        return this.stakingManager!.bond(stashAccount, controllerAccount, amount, signer);
      },

      /**
       * Add more tokens to existing bond
       */
      bondExtra: async (controllerAccount: string, amount: string | number): Promise<string> => {
        const signer = await this.walletManager!.getSigner(controllerAccount);
        return this.stakingManager!.bondExtra(controllerAccount, amount, signer);
      },

      /**
       * Nominate validators
       */
      nominate: async (controllerAccount: string, validators: string[]): Promise<string> => {
        const signer = await this.walletManager!.getSigner(controllerAccount);
        return this.stakingManager!.nominate(controllerAccount, validators, signer);
      },

      /**
       * Unbond tokens (start unbonding process)
       */
      unbond: async (controllerAccount: string, amount: string | number): Promise<string> => {
        const signer = await this.walletManager!.getSigner(controllerAccount);
        return this.stakingManager!.unbond(controllerAccount, amount, signer);
      },

      /**
       * Withdraw unbonded tokens
       */
      withdrawUnbonded: async (stashAccount: string, numSlashingSpans: number = 0): Promise<string> => {
        const signer = await this.walletManager!.getSigner(stashAccount);
        return this.stakingManager!.withdrawUnbonded(stashAccount, numSlashingSpans, signer);
      },

      /**
       * Get all active validators
       */
      getValidators: (): Promise<string[]> => this.stakingManager!.getValidators(),

      /**
       * Get validator preferences and commission
       */
      getValidatorPrefs: (validatorAddress: string) => 
        this.stakingManager!.getValidatorPrefs(validatorAddress),
    };
  }

  // Governance-related methods
  get governance() {
    if (!this.governanceManager || !this.walletManager) {
      throw new Error('SDK not connected. Call connect() first.');
    }

    return {
      /**
       * Get all active governance proposals
       */
      getActiveProposals: (): Promise<GovernanceProposal[]> => 
        this.governanceManager!.getActiveProposals(),

      /**
       * Vote on a referendum
       */
      vote: async (
        account: string,
        referendumIndex: number,
        vote: 'aye' | 'nay',
        conviction: number = 1,
        amount: string | number
      ): Promise<string> => {
        const signer = await this.walletManager!.getSigner(account);
        return this.governanceManager!.voteOnReferendum(
          account, 
          referendumIndex, 
          vote, 
          conviction, 
          amount, 
          signer
        );
      },

      /**
       * Get voting information for an account
       */
      getVotingInfo: (account: string, referendumIndex: number) => 
        this.governanceManager!.getVotingInfo(account, referendumIndex),

      /**
       * Get referendum details by index
       */
      getReferendumDetails: (referendumIndex: number) => 
        this.governanceManager!.getReferendumDetails(referendumIndex),

      /**
       * Get treasury proposals
       */
      getTreasuryProposals: () => this.governanceManager!.getTreasuryProposals(),

      /**
       * Submit a treasury proposal
       */
      submitTreasuryProposal: async (
        account: string, 
        value: string | number, 
        beneficiary: string
      ): Promise<string> => {
        const signer = await this.walletManager!.getSigner(account);
        return this.governanceManager!.submitTreasuryProposal(account, value, beneficiary, signer);
      },
    };
  }

  // Event subscription methods
  get events() {
    return {
      /**
       * Subscribe to blockchain events
       */
      subscribe: (callback: EventCallback): Promise<EventSubscription> => 
        this.chainManager.subscribeToEvents(callback),

      /**
       * Get current block number
       */
      getCurrentBlockNumber: (): Promise<number> => this.chainManager.getCurrentBlockNumber(),

      /**
       * Get block hash by number
       */
      getBlockHash: (blockNumber?: number): Promise<string> => 
        this.chainManager.getBlockHash(blockNumber),
    };
  }

  // Static helper methods
  static getWellKnownEndpoints() {
    return WELL_KNOWN_ENDPOINTS;
  }

  static isValidNetwork(network: string): network is NetworkName {
    return network in WELL_KNOWN_ENDPOINTS;
  }
}

// Export all types and constants for external use
export type {
  DotStarterConfig,
  WalletAccount,
  Balance,
  TransferOptions,
  TransferResult,
  StakingInfo,
  GovernanceProposal,
  ChainInfo,
  EventSubscription,
  EventCallback,
};

export type { NetworkName };

export {
  WELL_KNOWN_ENDPOINTS,
  DECIMALS,
  UNITS,
  SS58_FORMAT,
  DEFAULT_NETWORK,
} from './utils/constants';

// Default export
export default DotStarter;
