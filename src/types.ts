/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StockTicker =
  | 'AAPL'
  | 'MSFT'
  | 'AMZN'
  | 'GOOG'
  | 'META'
  | 'TSLA'
  | 'NVDA'
  | 'NFLX'
  | 'JPM'
  | 'DIS'
  | 'WMT'
  | 'SPY'
  | 'QQQ';

export interface StockInfo {
  ticker: StockTicker;
  name: string;
  category: 'Tech' | 'Index' | 'Retail/Entertainment' | 'Finance';
  description: string;
  dividendYield: number; // yearly yield as a percentage
}

export type RiskProfileType =
  | 'conservative'
  | 'balanced'
  | 'risktaker'
  | 'techbeliever'
  | 'dividend'
  | 'meme';

export interface RiskProfile {
  id: RiskProfileType;
  name: string;
  description: string;
  startingMoney: number;
  perks: string[];
  investingStyleDescription: string;
}

export type GameMode = 'historical' | 'chaos' | 'education' | 'speedrun' | 'sandbox';

export interface Holding {
  ticker: StockTicker;
  shares: number;
  averageCost: number;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD or YYYY-MM
  ticker: StockTicker;
  type: 'BUY' | 'SELL';
  shares: number;
  price: number;
  totalValue: number;
}

export type EventCategory =
  | 'life'
  | 'career'
  | 'market'
  | 'company'
  | 'economic'
  | 'opportunity'
  | 'badluck';

export interface ChoiceOption {
  id: string;
  text: string;
  descriptionOutcome: string;
  cashImpact: number;
  stockMultiplierImpact?: { ticker: StockTicker; factor: number };
}

export interface GameEvent {
  id: string;
  date: string; // Current simulated date of event
  category: EventCategory;
  title: string;
  description: string;
  cashImpact: number;
  stockMultiplierImpact?: { ticker: StockTicker; factor: number };
  choiceOptions?: ChoiceOption[];
  educationalTip?: string;
  impactResolvedText?: string;
}

export interface PortfolioHistoryItem {
  date: string;
  portfolioValue: number;
  cashBalance: number;
  holdingsValue: number;
}

export interface GameState {
  playerName: string;
  riskProfile: RiskProfileType;
  gameMode: GameMode;
  currentDate: string; // YYYY-MM-DD
  cashBalance: number;
  holdings: { [ticker in StockTicker]?: Holding };
  transactions: Transaction[];
  portfolioHistory: PortfolioHistoryItem[];
  achievements: string[];
  eventLogs: string[];
  academicTipsUnlocked: string[];
  gameStatus: 'onboarding' | 'playing' | 'gameover' | 'sandbox_config';
  lastRecapText?: string;
  lastRecapIsLoading?: boolean;
}

export const SUPPORTED_STOCKS: { [key in StockTicker]: StockInfo } = {
  AAPL: {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    category: 'Tech',
    description: 'Consumer electronics giant, maker of the iPhone, Mac, and iPad.',
    dividendYield: 0.5,
  },
  MSFT: {
    ticker: 'MSFT',
    name: 'Microsoft Corp.',
    category: 'Tech',
    description: 'Enterprise software, cloud computing (Azure), Xbox, and AI systems.',
    dividendYield: 0.7,
  },
  AMZN: {
    ticker: 'AMZN',
    name: 'Amazon.com, Inc.',
    category: 'Tech',
    description: 'E-commerce marketplace, logistics champion, and cloud provider (AWS).',
    dividendYield: 0.0,
  },
  GOOG: {
    ticker: 'GOOG',
    name: 'Alphabet Inc.',
    category: 'Tech',
    description: 'Search engine powerhouse, YouTube owner, and early leader in AI research.',
    dividendYield: 0.0,
  },
  META: {
    ticker: 'META',
    name: 'Meta Platforms Inc.',
    category: 'Tech',
    description: 'Social networking titan leading Facebook, Instagram, WhatsApp, and VR.',
    dividendYield: 0.0,
  },
  TSLA: {
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    category: 'Retail/Entertainment',
    description: 'Electric vehicle pioneer, energy storage, and autonomous technology driver.',
    dividendYield: 0.0,
  },
  NVDA: {
    ticker: 'NVDA',
    name: 'NVIDIA Corp.',
    category: 'Tech',
    description: 'Graphics processing units (GPUs) designer leading the global artificial intelligence wave.',
    dividendYield: 0.1,
  },
  NFLX: {
    ticker: 'NFLX',
    name: 'Netflix, Inc.',
    category: 'Retail/Entertainment',
    description: 'World-leading streaming entertainment platform that disrupted cable networks.',
    dividendYield: 0.0,
  },
  JPM: {
    ticker: 'JPM',
    name: 'JPMorgan Chase & Co.',
    category: 'Finance',
    description: 'Largest financial services conglomerate and investment bank in the US.',
    dividendYield: 2.3,
  },
  DIS: {
    ticker: 'DIS',
    name: 'The Walt Disney Co.',
    category: 'Retail/Entertainment',
    description: 'Global entertainment leader across theme parks, movies, and Disney+ streaming.',
    dividendYield: 1.1,
  },
  WMT: {
    ticker: 'WMT',
    name: 'Walmart Inc.',
    category: 'Retail',
    description: 'World\'s largest brick-and-mortar retail superstore operator.',
    dividendYield: 1.4,
  } as any, // Cast just in case category overlaps
  SPY: {
    ticker: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    category: 'Index',
    description: 'Exchange Traded Fund tracking the 500 largest publicly traded US companies.',
    dividendYield: 1.3,
  },
  QQQ: {
    ticker: 'QQQ',
    name: 'Invesco QQQ Trust',
    category: 'Index',
    description: 'Exchange Traded Fund tracking the Nasdaq-100 index, loaded with mega-cap tech.',
    dividendYield: 0.6,
  },
};

export const RISK_PROFILES: { [key in RiskProfileType]: RiskProfile } = {
  conservative: {
    id: 'conservative',
    name: 'Conservative Investor',
    description: 'Plays it extremely safe. Prioritizes wealth preservation.',
    startingMoney: 10000,
    perks: ['Unlocks SPY & QQQ discount pricing', 'Work bonuses are 20% higher', 'Reduced impact from Negative Career / Life events'],
    investingStyleDescription: 'You prefer stable growth. Ideal for Index funds and Walmart.',
  },
  balanced: {
    id: 'balanced',
    name: 'Balanced Investor',
    description: 'A classic middle-of-the-road approach. Fair risk, fair returns.',
    startingMoney: 10000,
    perks: ['Start with random pre-allocated positions in SPY', 'Receive passive cash dividends twice as fast', 'Balanced career path'],
    investingStyleDescription: 'Moderate volatility. Diverse allocations across sectors.',
  },
  risktaker: {
    id: 'risktaker',
    name: 'Risk-Taker',
    description: 'High volatility, high reward. Enjoys hyper-growth tech stocks and electric vehicles.',
    startingMoney: 10000,
    perks: ['Can unlock 1.5x gains on TSLA and NVDA spikes', '20% lower commission fees', 'Career fast-track potential'],
    investingStyleDescription: 'Maximum concentration. Vulnerable to market crises, but high upside.',
  },
  techbeliever: {
    id: 'techbeliever',
    name: 'Tech Believer',
    description: 'Firmly believes software, AI, and chips will eat the entire world.',
    startingMoney: 10000,
    perks: ['Double researched stock metrics on Nasdaq tech', 'Fictional tech news items give positive price boosts', 'Career in Silicon Valley'],
    investingStyleDescription: 'Heavy focus on Apple, Meta, Google, Microsoft, and Nvidia.',
  },
  dividend: {
    id: 'dividend',
    name: 'Dividend Investor',
    description: 'Collects cash checks. Loves dividend yields, cash accumulation, and value giants.',
    startingMoney: 10000,
    perks: ['Earn extra cash monthly from dividends', 'Safe-haven assets receive boosts during crashes', 'Starts with higher interest rate on cash holdings'],
    investingStyleDescription: 'Value focus on JPMorgan, Walmart, Disney, and SPY.',
  },
  meme: {
    id: 'meme',
    name: 'Meme Trader',
    description: 'Follows internet hype, forum feeds, and highly volatile trends. Slightly chaotic.',
    startingMoney: 10000,
    perks: ['Unlocks bizarre, highly chaotic random life events', 'Can gain or lose massive random sums of cash', 'Starts with direct access to highly volatile TSLA options simulator'],
    investingStyleDescription: 'Extreme concentration. A rollercoaster of high risk and potential overnight micro-riches.',
  },
};
