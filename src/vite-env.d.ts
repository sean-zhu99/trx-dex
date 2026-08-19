/// <reference types="vite/client" />

type TronContractCall = {
  call: () => Promise<unknown>;
};

type TronContractSend = {
  send: (options?: {
    callValue?: number;
    feeLimit?: number;
    shouldPollResponse?: boolean;
  }) => Promise<string | { txid?: string; transaction?: { txID?: string } }>;
};

type TronTrc20Contract = {
  balanceOf: (owner: string) => TronContractCall;
  decimals: () => TronContractCall;
  transfer: (receiver: string, amount: string) => TronContractSend;
};

type TronWebProvider = {
  defaultAddress?: {
    base58?: string;
  };
  trx: {
    getBalance: (address: string) => Promise<number>;
    sendTransaction: (
      receiver: string,
      amountSun: number,
    ) => Promise<string | { txid?: string; transaction?: { txID?: string } }>;
    sign: (transaction: unknown) => Promise<unknown>;
    sendRawTransaction: (transaction: unknown) => Promise<string | { txid?: string; txID?: string; transaction?: { txID?: string } }>;
  };
  contract: () => {
    at: (address: string) => Promise<TronTrc20Contract>;
  };
  transactionBuilder: {
    triggerSmartContract: (
      contractAddress: string,
      functionSelector: string,
      options: {
        callValue?: number;
        feeLimit?: number;
        input?: string;
      },
      parameters: unknown[],
      issuerAddress: string,
    ) => Promise<{
      result?: boolean;
      message?: string;
      transaction?: unknown;
    }>;
  };
};

type TronLinkProvider = {
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

interface ImportMetaEnv {
  readonly VITE_TRON_RECEIVER_ADDRESS?: string;
  readonly VITE_TRON_SWAP_API_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  tronWeb?: TronWebProvider;
  tronLink?: TronLinkProvider;
}
