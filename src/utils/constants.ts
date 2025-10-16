export const WELL_KNOWN_ENDPOINTS = {
  polkadot: 'wss://rpc.polkadot.io',
  kusama: 'wss://kusama-rpc.polkadot.io',
  westend: 'wss://westend-rpc.polkadot.io',
  rococo: 'wss://rococo-rpc.polkadot.io',
} as const;

export const DECIMALS = {
  polkadot: 10,
  kusama: 12,
  westend: 12,
  rococo: 12,
} as const;

export const UNITS = {
  polkadot: 'DOT',
  kusama: 'KSM',
  westend: 'WND',
  rococo: 'ROC',
} as const;

export const SS58_FORMAT = {
  polkadot: 0,
  kusama: 2,
  westend: 42,
  rococo: 42,
} as const;

export type NetworkName = keyof typeof WELL_KNOWN_ENDPOINTS;

export const DEFAULT_NETWORK: NetworkName = 'polkadot';
