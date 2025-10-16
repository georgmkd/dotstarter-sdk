import { ApiPromise, WsProvider } from '@polkadot/api';
import type { TransferOptions, TransferResult, ChainInfo, EventSubscription, EventCallback } from './types';
import type { NetworkName } from './utils/constants';
import { WELL_KNOWN_ENDPOINTS, DECIMALS, UNITS } from './utils/constants';

export class ChainManager {
  private api?: ApiPromise;
  private provider?: WsProvider;
  private network: NetworkName;
  private providerUrl: string;

  constructor(providerUrl?: string, network: NetworkName = 'polkadot') {
    this.network = network;
    this.providerUrl = providerUrl || WELL_KNOWN_ENDPOINTS[network];
  }

  /**
   * Connect to the blockchain
   */
  async connect(): Promise<ApiPromise> {
    if (this.api && this.api.isConnected) {
      return this.api;
    }

    this.provider = new WsProvider(this.providerUrl);
    this.api = await ApiPromise.create({ provider: this.provider });
    
    await this.api.isReady;
    return this.api;
  }

  /**
   * Disconnect from the blockchain
   */
  async disconnect(): Promise<void> {
    if (this.api) {
      await this.api.disconnect();
      this.api = undefined;
    }
    if (this.provider) {
      await this.provider.disconnect();
      this.provider = undefined;
    }
  }

  /**
   * Get the API instance (connect if not already connected)
   */
  async getApi(): Promise<ApiPromise> {
    if (!this.api || !this.api.isConnected) {
      await this.connect();
    }
    return this.api!;
  }

  /**
   * Check if connected to the blockchain
   */
  isConnected(): boolean {
    return this.api?.isConnected || false;
  }

  /**
   * Get chain information
   */
  async getChainInfo(): Promise<ChainInfo> {
    const api = await this.getApi();
    const chain = await api.rpc.system.chain();
    const version = await api.rpc.system.version();
    const properties = await api.rpc.system.properties();

    return {
      name: chain.toString(),
      version: version.toString(),
      properties: {
        ss58Format: properties.ss58Format.isSome ? properties.ss58Format.unwrap().toNumber() : 42,
        tokenDecimals: properties.tokenDecimals.isSome ? properties.tokenDecimals.unwrap().map((d: any) => d.toNumber()) : [10],
        tokenSymbol: properties.tokenSymbol.isSome ? properties.tokenSymbol.unwrap().map((s: any) => s.toString()) : ['DOT'],
      },
    };
  }

  /**
   * Send a transfer transaction
   */
  async transfer(options: TransferOptions, signer: any): Promise<TransferResult> {
    const api = await this.getApi();
    const { from, to, amount, tip = 0 } = options;

    // Convert amount to the correct units
    const decimals = DECIMALS[this.network];
    const transferAmount = typeof amount === 'string' 
      ? BigInt(amount) * BigInt(10 ** decimals)
      : BigInt(Math.floor(amount * (10 ** decimals)));

    const transfer = api.tx.balances.transferKeepAlive(to, transferAmount);

    return new Promise((resolve, reject) => {
      transfer
        .signAndSend(from, { signer, tip }, ({ status, events, dispatchError }: any) => {
          if (status.isInBlock) {
            const success = !dispatchError;
            
            if (dispatchError) {
              let errorMessage = 'Transaction failed';
              
              if (dispatchError.isModule) {
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs}`;
              }
              
              reject(new Error(errorMessage));
              return;
            }

            resolve({
              hash: transfer.hash.toHex(),
              blockHash: status.asInBlock.toHex(),
              success,
              events: events.map((record: any) => ({
                phase: record.phase.toString(),
                event: record.event.toHuman(),
              })),
            });
          } else if (status.isError || status.isDropped || status.isInvalid) {
            reject(new Error(`Transaction failed with status: ${status.type}`));
          }
        })
        .catch(reject);
    });
  }

  /**
   * Subscribe to blockchain events
   */
  async subscribeToEvents(callback: EventCallback): Promise<EventSubscription> {
    const api = await this.getApi();
    
    const unsubscribe = await api.query.system.events((events: any) => {
      const processedEvents = events.map((record: any) => ({
        phase: record.phase.toString(),
        event: record.event.toHuman(),
        topics: record.topics.map((t: any) => t.toString()),
      }));
      
      callback(processedEvents);
    });

    return { unsubscribe: () => (unsubscribe as any)() };
  }

  /**
   * Get current block number
   */
  async getCurrentBlockNumber(): Promise<number> {
    const api = await this.getApi();
    const header = await api.rpc.chain.getHeader();
    return header.number.toNumber();
  }

  /**
   * Get block hash by number
   */
  async getBlockHash(blockNumber?: number): Promise<string> {
    const api = await this.getApi();
    const hash = blockNumber 
      ? await api.rpc.chain.getBlockHash(blockNumber)
      : await api.rpc.chain.getFinalizedHead();
    
    return hash.toString();
  }
}
