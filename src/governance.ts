import type { ApiPromise } from '@polkadot/api';
import type { GovernanceProposal } from './types';

export class GovernanceManager {
  private api: ApiPromise;

  constructor(api: ApiPromise) {
    this.api = api;
  }

  /**
   * Get all active referenda/proposals
   */
  async getActiveProposals(): Promise<GovernanceProposal[]> {
    try {
      // Check if this is OpenGov (Gov2) or Legacy Governance
      const referendaEntries = await this.api.query.referenda?.referendumInfoFor?.entries();
      
      if (referendaEntries) {
        return this.parseOpenGovProposals(referendaEntries);
      } else {
        // Fall back to legacy democracy module
        const democracyEntries = await this.api.query.democracy?.referendumInfoOf?.entries();
        return this.parseLegacyProposals(democracyEntries || []);
      }
    } catch (error) {
      console.warn('Error fetching governance proposals:', error);
      return [];
    }
  }

  /**
   * Parse OpenGov (Gov2) proposals
   */
  private parseOpenGovProposals(entries: any[]): GovernanceProposal[] {
    return entries
      .map(([key, value]) => {
        try {
          const index = (key as any).args[0].toNumber();
          const info = (value as any).unwrap();
          
          if (info.isOngoing) {
            const ongoing = info.asOngoing;
            const track = ongoing.track?.toNumber() || 0;
            const submission = ongoing.submission;
            
            return {
              index,
              hash: (key as any).toHex(),
              author: submission?.who?.toString() || 'Unknown',
              deposit: submission?.amount?.toString() || '0',
              status: 'Active' as const,
              title: `Track ${track} - Referendum ${index}`,
              description: 'OpenGov Referendum',
              votingEnd: ongoing.deciding?.since?.toNumber(),
            };
          }
          return null;
        } catch (error) {
          console.warn('Error parsing OpenGov proposal:', error);
          return null;
        }
      })
      .filter(proposal => proposal !== null) as GovernanceProposal[];
  }

  /**
   * Parse Legacy Democracy proposals
   */
  private parseLegacyProposals(entries: any[]): GovernanceProposal[] {
    return entries
      .map(([key, value]) => {
        try {
          const index = (key as any).args[0].toNumber();
          const info = (value as any).unwrap();
          
          if (info.isOngoing) {
            const ongoing = info.asOngoing;
            
            return {
              index,
              hash: (key as any).toHex(),
              author: 'Democracy',
              deposit: '0',
              status: 'Active' as const,
              title: `Democracy Referendum ${index}`,
              description: 'Legacy Democracy Referendum',
              votingEnd: ongoing.end?.toNumber(),
            };
          }
          return null;
        } catch (error) {
          console.warn('Error parsing legacy proposal:', error);
          return null;
        }
      })
      .filter(proposal => proposal !== null) as GovernanceProposal[];
  }

  /**
   * Vote on a referendum (OpenGov)
   */
  async voteOnReferendum(
    account: string,
    referendumIndex: number,
    vote: 'aye' | 'nay',
    conviction: number,
    amount: string | number,
    signer: any
  ): Promise<string> {
    const decimals = this.api.registry.chainDecimals[0] || 10;
    const voteAmount = typeof amount === 'string' 
      ? BigInt(amount)
      : BigInt(Math.floor(amount * (10 ** decimals)));

    // Create vote object
    const voteObj = {
      Standard: {
        vote: vote === 'aye' ? { aye: true } : { nay: true },
        balance: voteAmount,
      }
    };

    const voteTx = this.api.tx.convictionVoting 
      ? this.api.tx.convictionVoting.vote(referendumIndex, voteObj)
      : this.api.tx.democracy.vote(referendumIndex, {
          [vote]: true,
          conviction,
        });

    return new Promise((resolve, reject) => {
      voteTx
        .signAndSend(account, { signer }, ({ status, dispatchError }: any) => {
          if (status.isInBlock) {
            if (dispatchError) {
              let errorMessage = 'Vote failed';
              
              if (dispatchError.isModule) {
                const decoded = this.api.registry.findMetaError(dispatchError.asModule);
                errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs}`;
              }
              
              reject(new Error(errorMessage));
              return;
            }

            resolve(voteTx.hash.toHex());
          } else if (status.isError || status.isDropped || status.isInvalid) {
            reject(new Error(`Vote failed with status: ${status.type}`));
          }
        })
        .catch(reject);
    });
  }

  /**
   * Get voting information for an account on a specific referendum
   */
  async getVotingInfo(account: string, referendumIndex: number): Promise<any> {
    try {
      // Try OpenGov first
      if (this.api.query.convictionVoting?.votingFor) {
        const voting = await this.api.query.convictionVoting.votingFor(account, 0); // Track 0 (Root)
        return voting.toHuman();
      }
      
      // Fall back to legacy democracy
      if (this.api.query.democracy?.votingOf) {
        const voting = await this.api.query.democracy.votingOf(account);
        return voting.toHuman();
      }
      
      return null;
    } catch (error) {
      console.warn('Error fetching voting info:', error);
      return null;
    }
  }

  /**
   * Get referendum details by index
   */
  async getReferendumDetails(referendumIndex: number): Promise<GovernanceProposal | null> {
    try {
      // Try OpenGov first
      if (this.api.query.referenda?.referendumInfoFor) {
        const info = await this.api.query.referenda.referendumInfoFor(referendumIndex);
        
        if ((info as any).isSome) {
          const referendumInfo = (info as any).unwrap();
          
          if (referendumInfo.isOngoing) {
            const ongoing = referendumInfo.asOngoing;
            const track = ongoing.track?.toNumber() || 0;
            const submission = ongoing.submission;
            
            return {
              index: referendumIndex,
              hash: (info as any).toHex(),
              author: submission?.who?.toString() || 'Unknown',
              deposit: submission?.amount?.toString() || '0',
              status: 'Active' as const,
              title: `Track ${track} - Referendum ${referendumIndex}`,
              description: 'OpenGov Referendum',
              votingEnd: ongoing.deciding?.since?.toNumber(),
            };
          }
        }
      }
      
      // Fall back to legacy democracy
      if (this.api.query.democracy?.referendumInfoOf) {
        const info = await this.api.query.democracy.referendumInfoOf(referendumIndex);
        
        if ((info as any).isSome) {
          const referendumInfo = (info as any).unwrap();
          
          if (referendumInfo.isOngoing) {
            const ongoing = referendumInfo.asOngoing;
            
            return {
              index: referendumIndex,
              hash: (info as any).toHex(),
              author: 'Democracy',
              deposit: '0',
              status: 'Active' as const,
              title: `Democracy Referendum ${referendumIndex}`,
              description: 'Legacy Democracy Referendum',
              votingEnd: ongoing.end?.toNumber(),
            };
          }
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Error fetching referendum details:', error);
      return null;
    }
  }

  /**
   * Get treasury proposals
   */
  async getTreasuryProposals(): Promise<any[]> {
    try {
      if (!this.api.query.treasury?.proposals) {
        return [];
      }
      
      const proposalEntries = await this.api.query.treasury.proposals.entries();
      
      return proposalEntries.map(([key, value]) => ({
        index: (key as any).args[0].toNumber(),
        proposal: (value as any).toHuman(),
      }));
    } catch (error) {
      console.warn('Error fetching treasury proposals:', error);
      return [];
    }
  }

  /**
   * Submit a treasury proposal
   */
  async submitTreasuryProposal(
    account: string,
    value: string | number,
    beneficiary: string,
    signer: any
  ): Promise<string> {
    const decimals = this.api.registry.chainDecimals[0] || 10;
    const proposalValue = typeof value === 'string' 
      ? BigInt(value)
      : BigInt(Math.floor(value * (10 ** decimals)));

    const proposalTx = this.api.tx.treasury.proposeSpend(proposalValue, beneficiary);

    return new Promise((resolve, reject) => {
      proposalTx
        .signAndSend(account, { signer }, ({ status, dispatchError }: any) => {
          if (status.isInBlock) {
            if (dispatchError) {
              let errorMessage = 'Treasury proposal failed';
              
              if (dispatchError.isModule) {
                const decoded = this.api.registry.findMetaError(dispatchError.asModule);
                errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs}`;
              }
              
              reject(new Error(errorMessage));
              return;
            }

            resolve(proposalTx.hash.toHex());
          } else if (status.isError || status.isDropped || status.isInvalid) {
            reject(new Error(`Treasury proposal failed with status: ${status.type}`));
          }
        })
        .catch(reject);
    });
  }
}
