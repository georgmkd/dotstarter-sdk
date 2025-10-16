import type { ApiPromise } from '@polkadot/api';
import type { StakingInfo } from './types';

export class StakingManager {
  private api: ApiPromise;

  constructor(api: ApiPromise) {
    this.api = api;
  }

  /**
   * Get staking information for an account
   */
  async getStakingInfo(address: string): Promise<StakingInfo> {
    const [stakingLedger, nominations] = await Promise.all([
      this.api.query.staking.ledger(address),
      this.api.query.staking.nominators(address),
    ]);

    let bonded = '0';
    let unbonding: Array<{ value: string; era: number }> = [];
    let redeemable = '0';
    let nominationTargets: string[] | undefined;

    if ((stakingLedger as any).isSome) {
      const ledger = (stakingLedger as any).unwrap();
      bonded = ledger.active.toString();
      
      // Get current era to calculate redeemable amounts
      const currentEra = await this.api.query.staking.currentEra();
      const currentEraNumber = (currentEra as any).unwrap().toNumber();
      
      // Process unlocking chunks
      unbonding = ledger.unlocking.map((chunk: any) => ({
        value: chunk.value.toString(),
        era: chunk.era.toNumber(),
      }));

      // Calculate redeemable amount (unbonding chunks from past eras)
      redeemable = unbonding
        .filter(chunk => chunk.era <= currentEraNumber)
        .reduce((total, chunk) => (BigInt(total) + BigInt(chunk.value)).toString(), '0');
    }

    if ((nominations as any).isSome) {
      const nominatorData = (nominations as any).unwrap();
      nominationTargets = nominatorData.targets.map((target: any) => target.toString());
    }

    return {
      bonded,
      unbonding,
      redeemable,
      nominations: nominationTargets,
    };
  }

  /**
   * Bond tokens for staking
   */
  async bond(stashAccount: string, controllerAccount: string, amount: string | number, signer: any): Promise<string> {
    const decimals = this.api.registry.chainDecimals[0] || 10;
    const bondAmount = typeof amount === 'string' 
      ? BigInt(amount)
      : BigInt(Math.floor(amount * (10 ** decimals)));

    const bondTx = this.api.tx.staking.bond(controllerAccount, bondAmount, 'Staked');

    return new Promise((resolve, reject) => {
      bondTx
        .signAndSend(stashAccount, { signer }, ({ status, dispatchError }: any) => {
          if (status.isInBlock) {
            if (dispatchError) {
              let errorMessage = 'Bonding failed';
              
              if (dispatchError.isModule) {
                const decoded = this.api.registry.findMetaError(dispatchError.asModule);
                errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs}`;
              }
              
              reject(new Error(errorMessage));
              return;
            }

            resolve(bondTx.hash.toHex());
          } else if (status.isError || status.isDropped || status.isInvalid) {
            reject(new Error(`Bonding failed with status: ${status.type}`));
          }
        })
        .catch(reject);
    });
  }

  /**
   * Add more tokens to existing bond
   */
  async bondExtra(controllerAccount: string, amount: string | number, signer: any): Promise<string> {
    const decimals = this.api.registry.chainDecimals[0] || 10;
    const bondAmount = typeof amount === 'string' 
      ? BigInt(amount)
      : BigInt(Math.floor(amount * (10 ** decimals)));

    const bondExtraTx = this.api.tx.staking.bondExtra(bondAmount);

    return new Promise((resolve, reject) => {
      bondExtraTx
        .signAndSend(controllerAccount, { signer }, ({ status, dispatchError }: any) => {
          if (status.isInBlock) {
            if (dispatchError) {
              let errorMessage = 'Bond extra failed';
              
              if (dispatchError.isModule) {
                const decoded = this.api.registry.findMetaError(dispatchError.asModule);
                errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs}`;
              }
              
              reject(new Error(errorMessage));
              return;
            }

            resolve(bondExtraTx.hash.toHex());
          } else if (status.isError || status.isDropped || status.isInvalid) {
            reject(new Error(`Bond extra failed with status: ${status.type}`));
          }
        })
        .catch(reject);
    });
  }

  /**
   * Nominate validators
   */
  async nominate(controllerAccount: string, validators: string[], signer: any): Promise<string> {
    const nominateTx = this.api.tx.staking.nominate(validators);

    return new Promise((resolve, reject) => {
      nominateTx
        .signAndSend(controllerAccount, { signer }, ({ status, dispatchError }: any) => {
          if (status.isInBlock) {
            if (dispatchError) {
              let errorMessage = 'Nomination failed';
              
              if (dispatchError.isModule) {
                const decoded = this.api.registry.findMetaError(dispatchError.asModule);
                errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs}`;
              }
              
              reject(new Error(errorMessage));
              return;
            }

            resolve(nominateTx.hash.toHex());
          } else if (status.isError || status.isDropped || status.isInvalid) {
            reject(new Error(`Nomination failed with status: ${status.type}`));
          }
        })
        .catch(reject);
    });
  }

  /**
   * Unbond tokens (start the unbonding process)
   */
  async unbond(controllerAccount: string, amount: string | number, signer: any): Promise<string> {
    const decimals = this.api.registry.chainDecimals[0] || 10;
    const unbondAmount = typeof amount === 'string' 
      ? BigInt(amount)
      : BigInt(Math.floor(amount * (10 ** decimals)));

    const unbondTx = this.api.tx.staking.unbond(unbondAmount);

    return new Promise((resolve, reject) => {
      unbondTx
        .signAndSend(controllerAccount, { signer }, ({ status, dispatchError }: any) => {
          if (status.isInBlock) {
            if (dispatchError) {
              let errorMessage = 'Unbonding failed';
              
              if (dispatchError.isModule) {
                const decoded = this.api.registry.findMetaError(dispatchError.asModule);
                errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs}`;
              }
              
              reject(new Error(errorMessage));
              return;
            }

            resolve(unbondTx.hash.toHex());
          } else if (status.isError || status.isDropped || status.isInvalid) {
            reject(new Error(`Unbonding failed with status: ${status.type}`));
          }
        })
        .catch(reject);
    });
  }

  /**
   * Withdraw unbonded tokens
   */
  async withdrawUnbonded(stashAccount: string, numSlashingSpans: number, signer: any): Promise<string> {
    const withdrawTx = this.api.tx.staking.withdrawUnbonded(numSlashingSpans);

    return new Promise((resolve, reject) => {
      withdrawTx
        .signAndSend(stashAccount, { signer }, ({ status, dispatchError }: any) => {
          if (status.isInBlock) {
            if (dispatchError) {
              let errorMessage = 'Withdraw unbonded failed';
              
              if (dispatchError.isModule) {
                const decoded = this.api.registry.findMetaError(dispatchError.asModule);
                errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs}`;
              }
              
              reject(new Error(errorMessage));
              return;
            }

            resolve(withdrawTx.hash.toHex());
          } else if (status.isError || status.isDropped || status.isInvalid) {
            reject(new Error(`Withdraw unbonded failed with status: ${status.type}`));
          }
        })
        .catch(reject);
    });
  }

  /**
   * Get all active validators
   */
  async getValidators(): Promise<string[]> {
    const validators = await this.api.query.session.validators();
    return (validators as any).map((validator: any) => validator.toString());
  }

  /**
   * Get validator preferences and commission
   */
  async getValidatorPrefs(validatorAddress: string): Promise<{ commission: string; blocked: boolean }> {
    const prefs = await this.api.query.staking.validators(validatorAddress);
    
    return {
      commission: (prefs as any).commission.toString(),
      blocked: (prefs as any).blocked.isTrue,
    };
  }
}
