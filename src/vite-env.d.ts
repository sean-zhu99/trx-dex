/// <reference types="vite/client" />

import type { PublicKey, Transaction } from '@solana/web3.js';

declare global {
  interface SolanaWalletProvider {
    isPhantom?: boolean;
    isSolflare?: boolean;
    publicKey?: PublicKey;
    connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
    disconnect?: () => Promise<void>;
    signTransaction?: (transaction: Transaction) => Promise<Transaction>;
    signAndSendTransaction?: (
      transaction: Transaction,
      options?: { skipPreflight?: boolean; preflightCommitment?: string },
    ) => Promise<{ signature: string }>;
  }

  interface Window {
    solana?: SolanaWalletProvider;
    solflare?: SolanaWalletProvider;
  }
}
