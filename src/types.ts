import type { ApiPromise } from '@polkadot/api';
import type { InjectedAccountWithMeta, InjectedExtension } from '@polkadot/extension-inject/types';
import type { NetworkName } from './utils/constants';

export interface DotStarterConfig {
  provider?: string;
  network?: NetworkName;
  timeout?: number;
}

export interface WalletAccount {
  address: string;
  name?: string;
  source?: string;
  type?: string;
}

export interface Balance {
  free: string;
  reserved: string;
  frozen: string;
  total: string;
  formatted: string;
  unit: string;
}

export interface TransferOptions {
  from: string;
  to: string;
  amount: string | number;
  tip?: string | number;
}

export interface TransferResult {
  hash: string;
  blockHash?: string;
  success: boolean;
  events?: any[];
}

export interface StakingInfo {
  bonded: string;
  unbonding: Array<{
    value: string;
    era: number;
  }>;
  redeemable: string;
  nominations?: string[];
}

export interface GovernanceProposal {
  index: number;
  hash: string;
  author: string;
  deposit: string;
  status: string;
  title?: string;
  description?: string;
  votingEnd?: number;
}

export interface ChainInfo {
  name: string;
  version: string;
  properties: {
    ss58Format: number;
    tokenDecimals: number[];
    tokenSymbol: string[];
  };
}

export interface EventSubscription {
  unsubscribe: () => void;
}

export type EventCallback = (events: any[]) => void;
