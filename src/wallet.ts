import { web3Accounts, web3Enable, web3FromSource } from '@polkadot/extension-dapp';
import type { InjectedAccountWithMeta, InjectedExtension } from '@polkadot/extension-inject/types';
import type { WalletAccount, Balance } from './types';
import type { ApiPromise } from '@polkadot/api';
import { formatBalance } from '@polkadot/util';

export class WalletManager {
  private api: ApiPromise;
  private extensions: Record<string, InjectedExtension> = {};

  constructor(api: ApiPromise) {
    this.api = api;
  }

  /**
   * Initialize wallet extensions and get available accounts
   */
  async initialize(): Promise<void> {
    const extensions = await web3Enable('DotStarter SDK');
    
    if (extensions.length === 0) {
      throw new Error('No wallet extensions found. Please install Polkadot.js or Talisman extension.');
    }

    // Store extensions for later use
    extensions.forEach(ext => {
      this.extensions[ext.name] = ext;
    });
  }

  /**
   * Get all available wallet accounts
   */
  async getAccounts(): Promise<WalletAccount[]> {
    const injectedAccounts = await web3Accounts();
    
    return injectedAccounts.map((account: InjectedAccountWithMeta) => ({
      address: account.address,
      name: account.meta.name,
      source: account.meta.source,
      type: account.type,
    }));
  }

  /**
   * Get balance for a specific address
   */
  async getBalance(address: string): Promise<Balance> {
    const accountInfo = await this.api.query.system.account(address);
    const chainInfo = await this.api.registry.getChainProperties();
    
    const decimals = chainInfo?.tokenDecimals?.isSome ? chainInfo.tokenDecimals.unwrap()[0]?.toNumber() || 10 : 10;
    const symbol = chainInfo?.tokenSymbol?.isSome ? chainInfo.tokenSymbol.unwrap()[0]?.toString() || 'DOT' : 'DOT';
    
    const balance = (accountInfo as any).data;
    const free = balance.free.toString();
    const reserved = balance.reserved.toString();
    const frozen = balance.frozen?.toString() || '0';
    
    // Calculate total transferable balance
    const total = balance.free.add(balance.reserved).toString();
    
    // Format balance for display
    const formatted = formatBalance(free, { 
      decimals, 
      withSi: true, 
      withUnit: symbol 
    });

    return {
      free,
      reserved,
      frozen,
      total,
      formatted,
      unit: symbol,
    };
  }

  /**
   * Get signer for a specific account
   */
  async getSigner(address: string) {
    const accounts = await this.getAccounts();
    const account = accounts.find(acc => acc.address === address);
    
    if (!account || !account.source) {
      throw new Error(`Account ${address} not found or has no source`);
    }

    const injector = await web3FromSource(account.source);
    return injector.signer;
  }

  /**
   * Check if wallet extensions are available
   */
  hasExtensions(): boolean {
    return Object.keys(this.extensions).length > 0;
  }

  /**
   * Get available extension names
   */
  getExtensionNames(): string[] {
    return Object.keys(this.extensions);
  }
}
