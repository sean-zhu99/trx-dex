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
  allowance: (owner: string, spender: string) => TronContractCall;
  approve: (spender: string, amount: string) => TronContractSend;
  balanceOf: (owner: string) => TronContractCall;
  decimals: () => TronContractCall;
  transfer: (receiver: string, amount: string) => TronContractSend;
};

type SunswapRouterContract = {
  getAmountsOut: (amountIn: string, path: string[]) => TronContractCall;
  swapExactETHForTokens: (
    amountOutMin: string,
    path: string[],
    to: string,
    deadline: number,
  ) => TronContractSend;
  swapExactTokensForETH: (
    amountIn: string,
    amountOutMin: string,
    path: string[],
    to: string,
    deadline: number,
  ) => TronContractSend;
  swapExactTokensForTokens: (
    amountIn: string,
    amountOutMin: string,
    path: string[],
    to: string,
    deadline: number,
  ) => TronContractSend;
};

type TronWebProvider = {
  defaultAddress?: {
    base58?: string;
  };
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  trx: {
    getBalance: (address: string) => Promise<number>;
    sendTransaction: (
      receiver: string,
      amountSun: number,
    ) => Promise<string | { txid?: string; transaction?: { txID?: string } }>;
  };
  contract: {
    (): {
      at: (address: string) => Promise<TronTrc20Contract>;
    };
    (abi: unknown, address: string): SunswapRouterContract;
  };
};

type TronLinkProvider = {
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  tronWeb?: TronWebProvider;
};

interface ImportMetaEnv {
  readonly VITE_TRON_RECEIVER_ADDRESS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  tronWeb?: TronWebProvider;
  tronLink?: TronLinkProvider;
}
