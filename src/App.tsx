/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  Search,
  BookOpen,
  Calendar,
  History,
  Briefcase,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  DollarSign,
  ChevronRight,
  TrendingDown,
  User,
  ArrowRight,
  RotateCcw,
  Plus,
  Minus,
  Sparkle
} from 'lucide-react';
import { GameState, StockTicker, SUPPORTED_STOCKS, RISK_PROFILES, Holding, Transaction, GameEvent, ChoiceOption } from './types';
import { getHistoricalPrice, getStockHistoryRange, getStockReturn } from './data/historicalPrices';
import { HISTORICAL_MARKET_EVENTS, getRandomLifeEvent } from './data/staticEvents';

// Initial Game Setup
const STARTING_YEAR = 2008;
const STARTING_MONTH = 1;

export default function App() {
  // Navigation tabs: 'dashboard' | 'market' | 'events' | 'learn' | 'history'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'market' | 'events' | 'learn' | 'history'>('dashboard');

  // Core Game State
  const [gameState, setGameState] = useState<GameState>(() => {
    // Attempt local storage recall
    try {
      const saved = localStorage.getItem('finsim_save_state_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Make sure it looks valid
        if (parsed && typeof parsed.cashBalance === 'number') {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not restore local state', e);
    }

    return {
      playerName: '',
      riskProfile: 'balanced',
      gameMode: 'historical',
      currentDate: '2008-01-15', // Starts Jan 2008
      cashBalance: 10000,
      holdings: {},
      transactions: [],
      portfolioHistory: [
        {
          date: '2008-01-15',
          portfolioValue: 10000,
          cashBalance: 10000,
          holdingsValue: 0,
        },
      ],
      achievements: [],
      eventLogs: ['Game started on January 15, 2008 with $10,000 cash balance.'],
      academicTipsUnlocked: ['diversification', 'compound_growth'],
      gameStatus: 'onboarding',
    };
  });

  // Local Storage Save Synchronization
  useEffect(() => {
    localStorage.setItem('finsim_save_state_v1', JSON.stringify(gameState));
  }, [gameState]);

  // Secondary interactive client states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicker, setSelectedTicker] = useState<StockTicker>('AAPL');
  const [tradeQuantity, setTradeQuantity] = useState<number>(10);
  const [selectedOnboardingRisk, setSelectedOnboardingRisk] = useState<'conservative' | 'balanced' | 'risktaker' | 'techbeliever' | 'dividend' | 'meme'>('balanced');
  const [onboardingName, setOnboardingName] = useState('');
  const [onboardingMode, setOnboardingMode] = useState<'historical' | 'chaos' | 'education'>('historical');
  
  // Custom interactive sandbox setup
  const [sandboxCash, setSandboxCash] = useState<number>(50000);
  const [sandboxYear, setSandboxYear] = useState<number>(2010);

  // Active / unresolved current events modal or prompt
  const [currentActiveEvent, setCurrentActiveEvent] = useState<GameEvent | null>(null);
  const [eventNotificationText, setEventNotificationText] = useState<string | null>(null);
  const [showRecapModal, setShowRecapModal] = useState<boolean>(false);

  // Parse Year/Month/Day
  const [cYear, cMonth, cDay] = gameState.currentDate.split('-').map(Number);

  // Calculated values
  const currentTotalHoldingsValue = (Object.values(gameState.holdings) as Holding[]).reduce((total, h) => {
    if (!h || h.shares <= 0) return total;
    const price = getHistoricalPrice(h.ticker, cYear, cMonth, cDay);
    return total + (h.shares * price);
  }, 0);

  const currentTotalPortfolioValue = gameState.cashBalance + currentTotalHoldingsValue;

  // Track daily or all-time gain percentage
  const initialValue = RISK_PROFILES[gameState.riskProfile]?.startingMoney || 10000;
  const allTimeGainAmount = currentTotalPortfolioValue - initialValue;
  const allTimeGainPercent = parseFloat(((allTimeGainAmount / initialValue) * 100).toFixed(1));

  // Determine benchmark targets
  const spyInitialPrice = getHistoricalPrice('SPY', STARTING_YEAR, STARTING_MONTH, 15);
  const spyCurrentPrice = getHistoricalPrice('SPY', cYear, cMonth, cDay);
  const benchmarkSpyReturn = parseFloat((((spyCurrentPrice - spyInitialPrice) / spyInitialPrice) * 100).toFixed(1));

  const qqqInitialPrice = getHistoricalPrice('QQQ', STARTING_YEAR, STARTING_MONTH, 15);
  const qqqCurrentPrice = getHistoricalPrice('QQQ', cYear, cMonth, cDay);
  const benchmarkQqqReturn = parseFloat((((qqqCurrentPrice - qqqInitialPrice) / qqqInitialPrice) * 100).toFixed(1));

  // Unlocks achievements as milestones are reached
  const checkAchievements = (stats: typeof gameState) => {
    const updatedAchievements = [...stats.achievements];
    const val = stats.cashBalance + (Object.values(stats.holdings) as Holding[]).reduce((tot, h) => {
      if (!h) return tot;
      return tot + h.shares * getHistoricalPrice(h.ticker, cYear, cMonth, cDay);
    }, 0);

    if (val >= 25000 && !updatedAchievements.includes('milestone_25k')) {
      updatedAchievements.push('milestone_25k');
      stats.eventLogs.unshift('🏆 Achievement Unlocked: Quarter Sized (Port breached $25,000!)');
    }
    if (val >= 100000 && !updatedAchievements.includes('milestone_100k')) {
      updatedAchievements.push('milestone_100k');
      stats.eventLogs.unshift('🏆 Achievement Unlocked: Six Figure Club (Port breached $100,000!)');
    }
    if (val >= 500000 && !updatedAchievements.includes('milestone_500k')) {
      updatedAchievements.push('milestone_500k');
      stats.eventLogs.unshift('🏆 Achievement Unlocked: Half Millionaire (Port breached $500,000!)');
    }
    if (val >= 1000000 && !updatedAchievements.includes('million_club')) {
      updatedAchievements.push('million_club');
      stats.eventLogs.unshift('🏆 Achievement Unlocked: 1,000,000 Club (Reached ultimate goal!)');
    }
    if (Object.keys(stats.holdings).length >= 5 && !updatedAchievements.includes('diversified_pioneer')) {
      updatedAchievements.push('diversified_pioneer');
      stats.eventLogs.unshift('🏆 Achievement Unlocked: Safe Harbor (Diversified across 5+ unique stocks)');
    }
  };

  // Onboarding Start Game trigger
  const startGame = () => {
    const profile = RISK_PROFILES[selectedOnboardingRisk];
    const initialCash = profile.startingMoney;

    const freshState: GameState = {
      playerName: onboardingName.trim() || 'Alex Reed',
      riskProfile: selectedOnboardingRisk,
      gameMode: onboardingMode,
      currentDate: '2008-01-15',
      cashBalance: initialCash,
      holdings: {},
      transactions: [],
      portfolioHistory: [
        {
          date: '2008-01-15',
          portfolioValue: initialCash,
          cashBalance: initialCash,
          holdingsValue: 0,
        },
      ],
      achievements: [],
      eventLogs: [`Game started with ${profile.name} risk profile.`],
      academicTipsUnlocked: ['diversification', 'compound_growth'],
      gameStatus: 'playing',
    };

    // Conservative Investor Perk: Discount on SPY/QQQ
    // Balanced Investor Perk: starts with pre-allocated positions in SPY
    if (selectedOnboardingRisk === 'balanced') {
      const spyPrice = getHistoricalPrice('SPY', 2008, 1, 15);
      const startingShares = 10;
      const initialCost = startingShares * spyPrice;
      freshState.holdings['SPY'] = {
        ticker: 'SPY',
        shares: startingShares,
        averageCost: spyPrice,
      };
      freshState.cashBalance -= initialCost;
      freshState.transactions.push({
        id: 'start_spy_pos',
        date: '2008-01-15',
        ticker: 'SPY',
        type: 'BUY',
        shares: startingShares,
        price: spyPrice,
        totalValue: initialCost,
      });
      freshState.eventLogs.push(`Starting perk bonus: Pre-allocated 10 SPY shares.`);
    }

    setGameState(freshState);
  };

  // Reset/Restart Game
  const resetGame = () => {
    localStorage.removeItem('finsim_save_state_v1');
    setGameState({
      playerName: '',
      riskProfile: 'balanced',
      gameMode: 'historical',
      currentDate: '2008-01-15',
      cashBalance: 10000,
      holdings: {},
      transactions: [],
      portfolioHistory: [
        {
          date: '2008-01-15',
          portfolioValue: 10000,
          cashBalance: 10000,
          holdingsValue: 0,
        },
      ],
      achievements: [],
      eventLogs: ['Game reset.'],
      academicTipsUnlocked: ['diversification'],
      gameStatus: 'onboarding',
    });
    setCurrentActiveEvent(null);
    setEventNotificationText(null);
    setShowRecapModal(false);
  };

  // Stock trading Buy / Sell execution
  const executeTrade = (type: 'BUY' | 'SELL', ticker: StockTicker) => {
    const currentPrice = getHistoricalPrice(ticker, cYear, cMonth, cDay);
    const totalCost = tradeQuantity * currentPrice;

    if (type === 'BUY') {
      let finalCost = totalCost;
      // Conservative discount perk
      if (gameState.riskProfile === 'conservative' && (ticker === 'SPY' || ticker === 'QQQ')) {
        finalCost = totalCost * 0.98; // 2% discount
      }
      
      if (gameState.cashBalance < finalCost) {
        alert('Insufficient cash buying power to execute this transaction.');
        return;
      }

      setGameState((prev) => {
        const next = { ...prev };
        const existing = next.holdings[ticker] || { ticker, shares: 0, averageCost: 0 };
        const nextShares = existing.shares + tradeQuantity;
        const nextAvgCost = ((existing.shares * existing.averageCost) + finalCost) / nextShares;

        next.holdings[ticker] = {
          ticker,
          shares: nextShares,
          averageCost: parseFloat(nextAvgCost.toFixed(2)),
        };
        next.cashBalance -= finalCost;
        next.transactions.unshift({
          id: `txn_${Date.now()}`,
          date: next.currentDate,
          ticker,
          type: 'BUY',
          shares: tradeQuantity,
          price: parseFloat(currentPrice.toFixed(2)),
          totalValue: parseFloat(finalCost.toFixed(2)),
        });
        next.eventLogs.unshift(`Bought ${tradeQuantity} shares of ${ticker} at $${currentPrice}.`);
        checkAchievements(next);
        return next;
      });
    } else {
      const existing = gameState.holdings[ticker];
      if (!existing || existing.shares < tradeQuantity) {
        alert('Insufficient share quantity owned to execute this trade.');
        return;
      }

      setGameState((prev) => {
        const next = { ...prev };
        const currentHeld = next.holdings[ticker]!;
        const remainingShares = currentHeld.shares - tradeQuantity;

        if (remainingShares <= 0) {
          delete next.holdings[ticker];
        } else {
          next.holdings[ticker] = {
            ...currentHeld,
            shares: remainingShares,
          };
        }

        let profitBoost = 1.0;
        // Risk-Taker Tech perk spike chance
        if (next.riskProfile === 'risktaker' && (ticker === 'TSLA' || ticker === 'NVDA') && Math.random() < 0.3) {
          profitBoost = 1.15; // 15% extra outcome revenue
        }

        const saleRevenue = totalCost * profitBoost;
        next.cashBalance += saleRevenue;
        next.transactions.unshift({
          id: `txn_${Date.now()}`,
          date: next.currentDate,
          ticker,
          type: 'SELL',
          shares: tradeQuantity,
          price: parseFloat(currentPrice.toFixed(2)),
          totalValue: parseFloat(saleRevenue.toFixed(2)),
        });
        next.eventLogs.unshift(`Sold ${tradeQuantity} shares of ${ticker} at $${currentPrice}${profitBoost > 1 ? ' (Risk-Taker Perk: +15% Boost!)' : ''}.`);
        checkAchievements(next);
        return next;
      });
    }
  };

  // Passive Dividend Accumulator
  const applyMonthlyDividends = (stats: GameState) => {
    let bonusFactor = 1.0;
    if (stats.riskProfile === 'dividend') {
      bonusFactor = 2.0; // Two times compound interest/dividends
    }

    let dividendSum = 0;
    (Object.values(stats.holdings) as Holding[]).forEach((holding) => {
      if (!holding || holding.shares <= 0) return;
      const info = SUPPORTED_STOCKS[holding.ticker];
      if (info && info.dividendYield > 0) {
        // approx monthly dividend payout
        const price = getHistoricalPrice(holding.ticker, cYear, cMonth, cDay);
        const payout = (holding.shares * price) * ((info.dividendYield / 100) / 12) * bonusFactor;
        dividendSum += payout;
      }
    });

    if (dividendSum > 0) {
      stats.cashBalance += parseFloat(dividendSum.toFixed(2));
      stats.eventLogs.unshift(`Received passive cash portfolio dividends: +$${dividendSum.toFixed(2)}`);
    }
  };

  // Time advancement core trigger
  const advanceTime = async (type: 'month' | 'year') => {
    let targetYear = cYear;
    let targetMonth = cMonth;

    if (type === 'month') {
      targetMonth += 1;
      if (targetMonth > 12) {
        targetMonth = 1;
        targetYear += 1;
      }
    } else {
      targetYear += 1;
    }

    // Verify boundary constraints (End is December 2025/Jan 2026)
    if (targetYear > 2025) {
      // Trigger ending scenario
      setGameState((prev) => ({
        ...prev,
        currentDate: '2025-12-31',
        gameStatus: 'gameover',
      }));
      return;
    }

    // Capture starting value for the summaries / year over year recap checks
    const oldPortfolioValue = currentTotalPortfolioValue;
    const nextDateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-15`;

    let activeEventsThisSession: GameEvent[] = [];

    // Trigger random BitLife-style events
    let cashImpactFromEvent = 0;
    let activePrompt: GameEvent | null = null;

    // Check if we have an explicit historical event for this target cycle
    const historicalEventForCycle = HISTORICAL_MARKET_EVENTS[targetYear]?.[targetMonth];
    if (historicalEventForCycle) {
      activePrompt = { ...historicalEventForCycle, date: nextDateStr };
      activeEventsThisSession.push(activePrompt);
    } else {
      // 40% probability of launching standard random career/life events
      if (Math.random() < 0.45) {
        // If GoogleGenAI is online, try loading bespoke scenarios from backend
        try {
          const res = await fetch('/api/ai/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              year: targetYear,
              playerMoney: gameState.cashBalance,
              riskProfile: gameState.riskProfile,
              currentHoldings: gameState.holdings,
            }),
          });
          const parsed = await res.json();
          if (parsed && parsed.event && !parsed.fallback) {
            activePrompt = { ...parsed.event, date: nextDateStr };
          } else {
            // standard client generator
            activePrompt = getRandomLifeEvent(nextDateStr, Object.keys(gameState.holdings));
          }
        } catch (e) {
          activePrompt = getRandomLifeEvent(nextDateStr, Object.keys(gameState.holdings));
        }

        if (activePrompt) {
          activeEventsThisSession.push(activePrompt);
        }
      }
    }

    // Set updated date state
    setGameState((prev) => {
      const next = { ...prev };
      next.currentDate = nextDateStr;

      // Unlocks academic tip cards based on historical cycles
      if (next.gameMode === 'education' || next.gameMode === 'historical') {
        if (targetYear >= 2008 && !next.academicTipsUnlocked.includes('rec_08')) {
          next.academicTipsUnlocked.push('rec_08');
        }
        if (targetYear >= 2013 && !next.academicTipsUnlocked.includes('etfs')) {
          next.academicTipsUnlocked.push('etfs');
        }
        if (targetYear >= 2020 && !next.academicTipsUnlocked.includes('bswans')) {
          next.academicTipsUnlocked.push('bswans');
        }
        if (targetYear >= 2023 && !next.academicTipsUnlocked.includes('aiboost')) {
          next.academicTipsUnlocked.push('aiboost');
        }
      }

      // Play career raise multipliers
      let monthlyContribution = 0;
      if (next.riskProfile === 'conservative') {
        monthlyContribution = 100; // conservative gets extra risk-free cash flows
      } else if (next.riskProfile === 'risktaker') {
        monthlyContribution = 250; // risktakers work hard side gigs
      } else {
        monthlyContribution = 150;
      }

      next.cashBalance += monthlyContribution;
      next.eventLogs.unshift(`Received regular income savings contribution: +$${monthlyContribution}`);

      // Apply passive stock dividends
      applyMonthlyDividends(next);

      // Check current events impact directly if it doesn't wait for choices
      if (activePrompt && !activePrompt.choiceOptions) {
        next.cashBalance += activePrompt.cashImpact;
        if (activePrompt.cashImpact !== 0) {
          const actionText = activePrompt.cashImpact > 0 ? 'gained' : 'lost';
          next.eventLogs.unshift(`[Event Alert: ${activePrompt.title}] You ${actionText} $${Math.abs(activePrompt.cashImpact)} cash.`);
        }
      }

      // Add portfolio history log
      const currentValCalculated = next.cashBalance + (Object.values(next.holdings) as Holding[]).reduce((sum, h) => {
        if (!h) return sum;
        const currentPrice = getHistoricalPrice(h.ticker, targetYear, targetMonth, 15);
        return sum + (h.shares * currentPrice);
      }, 0);

      next.portfolioHistory.push({
        date: nextDateStr,
        portfolioValue: currentValCalculated,
        cashBalance: next.cashBalance,
        holdingsValue: currentValCalculated - next.cashBalance,
      });

      checkAchievements(next);
      return next;
    });

    if (activePrompt) {
      setCurrentActiveEvent(activePrompt);
    }

    // Launch GoogleGenAI summary / advisor recap for the year progress
    if (type === 'year' || targetMonth === 12) {
      setGameState((prev) => ({ ...prev, lastRecapIsLoading: true }));
      try {
        const nextValCalculated = gameState.cashBalance + (Object.values(gameState.holdings) as Holding[]).reduce((sum, h) => {
          if (!h) return sum;
          const price = getHistoricalPrice(h.ticker, targetYear, targetMonth, 15);
          return sum + h.shares * price;
        }, 0);

        const pct = parseFloat((((nextValCalculated - oldPortfolioValue) / oldPortfolioValue) * 100).toFixed(1));

        const res = await fetch('/api/ai/recap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            year: targetYear,
            startValue: oldPortfolioValue.toFixed(2),
            endValue: nextValCalculated.toFixed(2),
            percentChange: pct,
            riskProfile: gameState.riskProfile,
            holdings: gameState.holdings,
            cashBalance: gameState.cashBalance,
            eventsThisYear: activeEventsThisSession,
          }),
        });
        const parsed = await res.json();
        if (parsed && parsed.recap) {
          setGameState((prev) => ({
            ...prev,
            lastRecapText: parsed.recap,
            lastRecapIsLoading: false,
          }));
          setShowRecapModal(true);
        } else {
          setGameState((prev) => ({ ...prev, lastRecapIsLoading: false }));
        }
      } catch (err) {
        setGameState((prev) => ({ ...prev, lastRecapIsLoading: false }));
      }
    }
  };

  // Resolved dynamic BitLife interactive choices trigger
  const resolveChoice = (option: ChoiceOption, event: GameEvent) => {
    setGameState((prev) => {
      const next = { ...prev };
      next.cashBalance += option.cashImpact;
      
      // Apply any stock multiplier factor
      if (option.stockMultiplierImpact && next.holdings[option.stockMultiplierImpact.ticker]) {
        const target = next.holdings[option.stockMultiplierImpact.ticker]!;
        // Boosts the cost efficacy or gives free absolute stock valuation adjustments
        next.holdings[option.stockMultiplierImpact.ticker] = {
          ...target,
          averageCost: parseFloat((target.averageCost * option.stockMultiplierImpact.factor).toFixed(2)),
        };
      }

      next.eventLogs.unshift(`[Resolved: ${event.title}] Option: "${option.text}" Outcome: ${option.descriptionOutcome}`);
      checkAchievements(next);
      return next;
    });

    setEventNotificationText(`Choice resolved! ${option.descriptionOutcome} (Cash impact: ${option.cashImpact >= 0 ? '+' : ''}$${option.cashImpact})`);
    setCurrentActiveEvent(null);
  };

  const filteredStocks = Object.values(SUPPORTED_STOCKS).filter((stock) => {
    const q = searchQuery.toLowerCase();
    return stock.ticker.toLowerCase().includes(q) || stock.name.toLowerCase().includes(q) || stock.category.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-[#05070a] text-white font-sans flex flex-col justify-between select-none">
      {/* HEADER SECTION */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/[0.08] backdrop-blur-md bg-[#161d2f]/70 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-100 bg-clip-text text-transparent">FinSim</span>
            <span className="text-xs text-emerald-500 font-bold px-1.5 py-0.5 bg-emerald-500/10 rounded">2.0 MVP</span>
          </div>
        </div>

        {gameState.gameStatus !== 'onboarding' && (
          <div className="flex items-center gap-8">
            <div className="flex flex-col text-center">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Simulated Date</span>
              <span className="text-sm font-medium text-emerald-400 flex items-center gap-1.5 justify-center">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(cYear, cMonth - 1, 15).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            <div className="hidden md:flex flex-col text-left">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Progress to $1M Target</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(1, (currentTotalPortfolioValue / 1000000) * 100))}%` }}
                  ></div>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">
                  {Math.min(100, ((currentTotalPortfolioValue / 1000000) * 100)).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold block text-slate-200">{gameState.playerName}</span>
              <span className="text-[10px] text-teal-400 block font-medium capitalize">{gameState.riskProfile} Profile</span>
            </div>
          </div>
        )}
      </header>

      {/* DETAILED ROOT CONTROLLER SHELL */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* SIDE BAR NAVIGATION RAIL */}
        {gameState.gameStatus !== 'onboarding' && (
          <aside className="w-full md:w-20 border-b md:border-b-0 md:border-r border-white/[0.08] backdrop-blur-md bg-[#161d2f]/50 flex md:flex-col items-center justify-around md:justify-start md:py-8 gap-8 px-2 py-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`p-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-emerald-500/15 text-emerald-500' : 'text-slate-400 hover:text-white'}`}
              title="Dashboard"
            >
              <TrendingUp className="w-5 h-5 mx-auto" />
              <span className="md:hidden text-[9px] block mt-0.5">Stats</span>
            </button>
            <button
              onClick={() => setActiveTab('market')}
              className={`p-3 rounded-xl transition-all ${activeTab === 'market' ? 'bg-emerald-500/15 text-emerald-500' : 'text-slate-400 hover:text-white'}`}
              title="Market Center"
            >
              <Search className="w-5 h-5 mx-auto" />
              <span className="md:hidden text-[9px] block mt-0.5">Trade</span>
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`p-3 rounded-xl transition-all ${activeTab === 'events' ? 'bg-emerald-500/15 text-emerald-500' : 'text-slate-400 hover:text-white relative'}`}
              title="State Events Log"
            >
              <History className="w-5 h-5 mx-auto" />
              {currentActiveEvent && <span className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full animate-ping" />}
              <span className="md:hidden text-[9px] block mt-0.5">Timeline</span>
            </button>
            <button
              onClick={() => setActiveTab('learn')}
              className={`p-3 rounded-xl transition-all ${activeTab === 'learn' ? 'bg-emerald-500/15 text-emerald-500' : 'text-slate-400 hover:text-white'}`}
              title="Educational Material"
            >
              <BookOpen className="w-5 h-5 mx-auto" />
              <span className="md:hidden text-[9px] block mt-0.5">Learn</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`p-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-emerald-500/15 text-emerald-500' : 'text-slate-400 hover:text-white'}`}
              title="Ledger"
            >
              <Briefcase className="w-5 h-5 mx-auto" />
              <span className="md:hidden text-[9px] block mt-0.5">Ledger</span>
            </button>

            <button
              onClick={resetGame}
              className="md:mt-auto p-3 text-red-400 hover:text-red-300 rounded-xl transition-all hover:bg-red-500/10"
              title="Restart Game State"
            >
              <RotateCcw className="w-5 h-5 mx-auto" />
              <span className="md:hidden text-[9px] block mt-0.5">Reset</span>
            </button>
          </aside>
        )}

        {/* PRIMARY ROUTE ROUTING ENGINE */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6" id="fin-route-container">
          {/* SCREEN 1: ONBOARDING ENGINE */}
          {gameState.gameStatus === 'onboarding' && (
            <div className="max-w-xl mx-auto py-10">
              <div className="text-center mb-8">
                <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">Build Your Fortune</span>
                <h1 className="text-4xl font-extrabold tracking-tight">FinSim Simulation Entry</h1>
                <p className="text-sm text-slate-400 mt-2">
                  The year is <strong className="text-emerald-400 font-bold">2008</strong>. The great global market crash wiped out your family's savings.
                  You are left with only <strong className="text-emerald-400">$10,000</strong>. Can you navigate historical shocks to reach <strong className="text-white font-bold">$1,000,000 before 2025 ends?</strong>
                </p>
              </div>

              <div className="backdrop-blur-md bg-[#161d2f]/70 border border-white/[0.08] p-6 rounded-3xl shadow-xl flex flex-col gap-6">
                <div>
                  <label className="text-xs tracking-wider uppercase font-bold text-slate-300">Player Label Name</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={onboardingName}
                    onChange={(e) => setOnboardingName(e.target.value)}
                    className="w-full mt-1.5 p-3.5 bg-slate-900 border border-white/[0.1] rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm font-semibold transition"
                  />
                </div>

                <div>
                  <label className="text-xs tracking-wider uppercase font-bold text-slate-300">Choose Game Play Mode</label>
                  <div className="grid grid-cols-3 gap-3 mt-1.5">
                    <button
                      onClick={() => { setOnboardingMode('historical'); }}
                      className={`p-3.5 rounded-2xl text-left border ${onboardingMode === 'historical' ? 'border-emerald-500 bg-emerald-500/10 text-white' : 'border-white/[0.08] bg-[#1a2333]/50 text-slate-400'} transition`}
                    >
                      <h4 className="text-xs font-extrabold uppercase">Historical</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug">Uses real-world historical stock closes.</p>
                    </button>
                    <button
                      onClick={() => { setOnboardingMode('chaos'); }}
                      className={`p-3.5 rounded-2xl text-left border ${onboardingMode === 'chaos' ? 'border-amber-500 bg-amber-500/10 text-white' : 'border-white/[0.08] bg-[#1a2333]/50 text-slate-400'} transition`}
                    >
                      <h4 className="text-xs font-extrabold uppercase text-amber-400">Chaos Mode</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug">Adds random fictional surprise events.</p>
                    </button>
                    <button
                      onClick={() => { setOnboardingMode('education'); }}
                      className={`p-3.5 rounded-2xl text-left border ${onboardingMode === 'education' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/[0.08] bg-[#1a2333]/50 text-slate-400'} transition`}
                    >
                      <h4 className="text-xs font-extrabold uppercase text-blue-400">Education</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug">Unlocks detailed investing lessons.</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs tracking-wider uppercase font-bold text-slate-300">Starting Personality &amp; Risk Profile</label>
                  <div className="grid grid-cols-2 gap-3 mt-1.5 text-xs">
                    {Object.values(RISK_PROFILES).map((prof) => (
                      <button
                        key={prof.id}
                        onClick={() => setSelectedOnboardingRisk(prof.id)}
                        className={`p-4 rounded-2xl border text-left flex flex-col justify-between ${selectedOnboardingRisk === prof.id ? 'border-emerald-400 bg-emerald-400/10' : 'border-white/[0.08] hover:border-white/10 background: rgba(22, 29, 47, 0.4)'} transition`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold tracking-tight text-white">{prof.name}</span>
                            {selectedOnboardingRisk === prof.id && <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />}
                          </div>
                          <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">{prof.description}</p>
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-white/[0.05]">
                          <span className="text-[9px] uppercase tracking-wider text-emerald-400 block font-bold">Key Perks:</span>
                          <span className="text-[9px] text-slate-400 leading-snug">{prof.perks[0]}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.05]">
                  <p className="text-[10px] text-zinc-500 text-center leading-relaxed">
                    Disclaimer: FinSim is an interactive educational simulation. Content produced inside this app does not constitute financial advice. Past performance of tickers is never guarantee of future returns.
                  </p>
                </div>

                <button
                  onClick={startGame}
                  className="w-full mt-3 p-4 bg-emerald-500 hover:bg-emerald-400 rounded-2xl font-bold flex items-center justify-center gap-2 text-white shadow-xl shadow-emerald-500/20 active:scale-95 transition"
                >
                  Enter Simulator Mode <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 2: MAIN DASHBOARD */}
          {gameState.gameStatus === 'playing' && activeTab === 'dashboard' && (
            <div className="flex flex-col gap-6">
              {/* HEADER HIGHLIGHT ROW */}
              {eventNotificationText && (
                <div className="flex items-center justify-between p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                  <span className="text-xs tracking-wide text-emerald-400 font-semibold">{eventNotificationText}</span>
                  <button onClick={() => setEventNotificationText(null)} className="text-[10px] uppercase font-extrabold text-slate-400 hover:text-white px-2 py-1">Dismiss</button>
                </div>
              )}

              {/* DYNAMIC ADVISOR RECAP LOGIC VIEW */}
              {gameState.lastRecapText && (
                <div className="p-5 backdrop-blur-md bg-gradient-to-r from-emerald-950/40 to-teal-900/40 border-2 border-emerald-500/30 rounded-3xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
                  <div className="flex items-center gap-2 mb-2 text-emerald-400">
                    <Sparkles className="w-4 h-4 animate-bounce" />
                    <span className="text-xs uppercase tracking-widest font-extrabold">Active AI Robo-Advisor Recap</span>
                  </div>
                  <div className="text-xs leading-relaxed text-slate-200 whitespace-pre-line prose prose-invert font-medium max-w-none">
                    {gameState.lastRecapText}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* PORTFOLIO ACCUMULATION CARD */}
                <div className="lg:col-span-2 backdrop-blur-md bg-[#161d2f]/70 border border-white/[0.08] rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Portfolio Valuation</span>
                    <h2 className="text-5xl font-extrabold tracking-tight text-white mt-1.5 flex items-baseline gap-1" id="total-val-display font-mono">
                      ${currentTotalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <span className={`text-xs mt-2.5 font-bold flex items-center ${allTimeGainPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {allTimeGainPercent >= 0 ? <TrendingUp className="w-4 h-4 mr-1 inline" /> : <TrendingDown className="w-4 h-4 mr-1 inline" />}
                      {allTimeGainPercent >= 0 ? '+' : ''}${Math.abs(allTimeGainAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ({allTimeGainPercent}%) Net Return
                    </span>
                  </div>

                  {/* HIGH-FIDELITY SIMPLE SVG SPARKLINE */}
                  <div className="mt-8 h-24 relative opacity-80" id="port-sparkline-canvas">
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <defs>
                        <linearGradient id="allTimeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {gameState.portfolioHistory.length > 1 ? (
                        <>
                          <path
                            d={(() => {
                              const points = gameState.portfolioHistory.map((item, index) => {
                                const x = (index / (gameState.portfolioHistory.length - 1)) * 100;
                                // Normalize between min and max portfolio values logged
                                const values = gameState.portfolioHistory.map((j) => j.portfolioValue);
                                const min = Math.min(...values);
                                const max = Math.max(...values);
                                const range = max - min || 1;
                                const y = 90 - ((item.portfolioValue - min) / range) * 80;
                                return `${x},${y}`;
                              });
                              return `M ${points.join(' L ')}`;
                            })()}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                          <path
                            d={(() => {
                              const points = gameState.portfolioHistory.map((item, index) => {
                                const x = (index / (gameState.portfolioHistory.length - 1)) * 100;
                                const values = gameState.portfolioHistory.map((j) => j.portfolioValue);
                                const min = Math.min(...values);
                                const max = Math.max(...values);
                                const range = max - min || 1;
                                const y = 90 - ((item.portfolioValue - min) / range) * 80;
                                return `${x},${y}`;
                              });
                              return `M 0,100 L ${points[0]} L ${points.join(' L ')} L 100,100 Z`;
                            })()}
                            fill="url(#allTimeGrad)"
                          />
                        </>
                      ) : (
                        <line x1="0" y1="50" x2="100" y2="50" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" />
                      )}
                    </svg>
                  </div>
                </div>

                {/* CONTROLS PANELS */}
                <div className="flex flex-col gap-4">
                  <div className="flex-1 backdrop-blur-md bg-[#161d2f]/70 border border-white/[0.08] rounded-3xl p-5 flex flex-col justify-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cash Buying Power</span>
                    <h3 className="text-3xl font-mono font-bold mt-1 text-white">${gameState.cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                      <span>Reserve: $0</span>
                      <span>Settled: 100%</span>
                    </div>
                  </div>

                  {/* TIME ADVANCER TRIGGER CARD */}
                  <div className="block backdrop-blur-md bg-emerald-600 hover:bg-emerald-500 transition-all cursor-pointer rounded-3xl p-5 shadow-lg shadow-emerald-500/10 select-none group relative overflow-hidden" id="btn-advance-time">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8 blur-xl" />
                    <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-100">Simulator Progression</span>
                    <h4 className="text-xl font-extrabold text-white mt-1 group-hover:translate-x-1 duration-200 flex items-center gap-1.5">
                      Advance Timeline <ChevronRight className="w-5 h-5" />
                    </h4>
                    <p className="text-[10px] text-emerald-100/70 mt-1 leading-snug font-medium">
                      Simulates stock price shifts, saves regular salary, unlocks event matrices, and releases compound yields.
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-4.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); advanceTime('month'); }}
                        className="py-2 px-3 bg-white/10 hover:bg-white/20 text-xs font-bold rounded-xl text-center cursor-pointer transition active:scale-95"
                      >
                        +1 Month
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); advanceTime('year'); }}
                        className="py-2 px-3 bg-white/25 hover:bg-white/35 text-xs font-bold rounded-xl text-center cursor-pointer transition active:scale-95"
                      >
                        +1 Year {gameState.lastRecapIsLoading ? '(Generating...)' : ''}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* ACTIVE SIMULATED LIFE EVENT POPUP CARD */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  {currentActiveEvent ? (
                    <div className="backdrop-blur-md bg-gradient-to-br from-amber-950/40 to-slate-900/40 border border-amber-500/30 rounded-3xl p-5 relative overflow-hidden flex-1 flex flex-col justify-between">
                      <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/5 rounded-full blur-3xl z-0" />
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3 text-amber-400">
                          <AlertCircle className="w-4 h-4 animate-pulse shrink-0" />
                          <span className="text-xs uppercase tracking-widest font-extrabold block">Active Decision Event</span>
                        </div>
                        <h3 className="text-xl font-extrabold text-amber-400 leading-tight block">{currentActiveEvent.title}</h3>
                        <p className="text-xs text-slate-200 leading-relaxed mt-2 block">{currentActiveEvent.description}</p>

                        {currentActiveEvent.educationalTip && (
                          <div className="mt-4 p-3 bg-slate-900/80 border border-white/[0.05] rounded-2xl">
                            <span className="text-[10px] text-emerald-400 uppercase font-black tracking-wide block">Investing Concept</span>
                            <p className="text-[10.5px] text-slate-300 leading-relaxed mt-0.5">{currentActiveEvent.educationalTip}</p>
                          </div>
                        )}
                      </div>

                      {currentActiveEvent.choiceOptions && currentActiveEvent.choiceOptions.length > 0 ? (
                        <div className="mt-6 flex flex-col gap-2 relative z-10">
                          {currentActiveEvent.choiceOptions.map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => resolveChoice(opt, currentActiveEvent!)}
                              className="w-full text-left p-3.5 bg-[#1e273a] hover:bg-[#25324d] border border-white/[0.08] hover:border-emerald-500/30 text-xs font-bold rounded-2xl flex items-center justify-between gap-3 group transition active:scale-98"
                            >
                              <span className="text-slate-100 group-hover:text-emerald-300">{opt.text}</span>
                              <div className="w-5 h-5 bg-emerald-500/10 rounded-full flex items-center justify-center shrink-0">
                                <ChevronRight className="w-3 h-3 text-emerald-400 group-hover:translate-x-0.5 duration-100" />
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-6 relative z-10">
                          <button
                            onClick={() => {
                              setEventNotificationText(currentActiveEvent!.cashImpact !== 0 ? `Unresolved life event applied: $${currentActiveEvent!.cashImpact}` : `Event acknowledged.`);
                              setCurrentActiveEvent(null);
                            }}
                            className="w-full p-3 bg-[#1e273a] hover:bg-slate-800 text-xs font-bold rounded-2xl border border-white/[0.05] text-center"
                          >
                            Acknowledge Event
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="backdrop-blur-md bg-[#161d2f]/70 border border-white/[0.08] rounded-3xl p-6 flex-1 flex flex-col items-center justify-center text-center py-10">
                      <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mb-3">
                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">No Active Critical Scenarios</h4>
                      <p className="text-[11px] text-zinc-500 mt-1 shadow-inner leading-relaxed max-w-[240px]">
                        Everything looks serene. Advance timeline dates to capture randomized life conditions.
                      </p>
                    </div>
                  )}

                  {/* BENCHMARK COMPARATOR CARD */}
                  <div className="backdrop-blur-md bg-[#161d2f]/70 border border-white/[0.08] rounded-3xl p-4 flex flex-col gap-3">
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Benchmark Performance Comparison</h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 bg-slate-900 rounded-2xl">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">Your Port</span>
                        <span className={`text-xs font-bold block mt-1 ${allTimeGainPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {allTimeGainPercent >= 0 ? '+' : ''}{allTimeGainPercent}%
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded-2xl">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">S&amp;P 500 (SPY)</span>
                        <span className={`text-xs font-bold block mt-1 ${benchmarkSpyReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {benchmarkSpyReturn >= 0 ? '+' : ''}{benchmarkSpyReturn}%
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded-2xl">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">Nasdaq (QQQ)</span>
                        <span className={`text-xs font-bold block mt-1 ${benchmarkQqqReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {benchmarkQqqReturn >= 0 ? '+' : ''}{benchmarkQqqReturn}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CURRENT POSITIONS TABLE */}
                <div className="lg:col-span-7 backdrop-blur-md bg-[#161d2f]/70 border border-white/[0.08] rounded-3xl p-5 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-300">Portfolio Active Assets / Holdings</h3>
                    <span className="text-[10px] font-bold text-slate-400">{Object.keys(gameState.holdings).length} Distinct Positions</span>
                  </div>

                  <div className="flex flex-col gap-3 overflow-y-auto max-h-[340px] pr-1.5" id="positions-table-list">
                    {(Object.values(gameState.holdings) as Holding[]).map((holding) => {
                      if (!holding || holding.shares <= 0) return null;
                      const currentPrice = getHistoricalPrice(holding.ticker, cYear, cMonth, cDay);
                      const costValue = holding.shares * holding.averageCost;
                      const marketValue = holding.shares * currentPrice;
                      const returnDollar = marketValue - costValue;
                      const returnPercent = parseFloat(((returnDollar / costValue) * 100).toFixed(1));

                      return (
                        <div
                          key={holding.ticker}
                          onClick={() => { setSelectedTicker(holding.ticker); setActiveTab('market'); }}
                          className="flex items-center justify-between p-3.5 bg-slate-900 hover:bg-[#1a2333]/90 rounded-2xl border border-white/[0.04] hover:border-emerald-500/20 cursor-pointer transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-black text-xs">
                              {holding.ticker}
                            </div>
                            <div>
                              <p className="text-xs font-extrabold text-white">{SUPPORTED_STOCKS[holding.ticker]?.name}</p>
                              <p className="text-[10px] text-slate-400">
                                {holding.shares} Shares @ Avg ${holding.averageCost}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-mono font-bold text-white">${marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            <span className={`text-[10px] font-mono font-bold ${returnDollar >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {returnDollar >= 0 ? '+' : ''}{returnPercent}% (${returnDollar.toFixed(1)})
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {Object.keys(gameState.holdings).length === 0 && (
                      <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl">
                        <span className="text-xs font-bold text-zinc-500 block">You are 100% Cash</span>
                        <p className="text-[10px] text-zinc-600 mt-1 max-w-[260px] mx-auto leading-relaxed">
                          Your money is sat yields risk-free but not matching equity momentum. Go to the market tab to load core assets.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 3: MARKET & TRADING DASHBOARD */}
          {gameState.gameStatus === 'playing' && activeTab === 'market' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* TICKERS SELECTOR FEED */}
              <div className="lg:col-span-4 backdrop-blur-md bg-[#161d2f]/70 border border-white/[0.08] rounded-3xl p-5 flex flex-col h-[520px]">
                <div className="relative mb-3">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="Search tickers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 p-3 bg-slate-900 border border-white/[0.08] rounded-2xl text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-bold transition"
                  />
                </div>

                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5">
                  {filteredStocks.map((stock) => {
                    const price = getHistoricalPrice(stock.ticker, cYear, cMonth, cDay);
                    const isSelected = selectedTicker === stock.ticker;
                    const position = gameState.holdings[stock.ticker];

                    return (
                      <button
                        key={stock.ticker}
                        onClick={() => setSelectedTicker(stock.ticker)}
                        className={`w-full text-left p-3 rounded-2xl flex items-center justify-between border ${isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/[0.04] bg-slate-900 hover:bg-[#1a2333]'} transition`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">
                            {stock.ticker}
                          </div>
                          <div>
                            <p className="text-[11px] font-extrabold text-white leading-none">{stock.name}</p>
                            <span className="text-[9px] text-slate-400 block mt-0.5">{stock.category}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-mono font-bold text-white">${price.toFixed(2)}</p>
                          {position && (
                            <span className="text-[9px] font-bold text-teal-400 block mt-0.5">{position.shares} Shares Owned</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DYNAMIC TRADE DETAIL & GRAPH */}
              <div className="lg:col-span-8 flex flex-col md:flex-row gap-6">
                {/* INTERACTIVE DETAILS CARD */}
                <div className="flex-1 backdrop-blur-md bg-[#161d2f]/70 border border-white/[0.08] rounded-3xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-bold text-emerald-400 block tracking-widest">{SUPPORTED_STOCKS[selectedTicker]?.category} Equity</span>
                      <span className="text-[10px] text-slate-400 font-bold">Close Quote</span>
                    </div>
                    <div className="flex items-baseline justify-between mt-2">
                      <h2 className="text-4xl font-extrabold text-white flex items-baseline gap-1 font-mono">
                        ${getHistoricalPrice(selectedTicker, cYear, cMonth, cDay).toFixed(2)}
                      </h2>
                      <span className="text-xs font-bold text-emerald-400 capitalize">
                        Dividend: {SUPPORTED_STOCKS[selectedTicker]?.dividendYield}% Yield
                      </span>
                    </div>

                    <h3 className="text-lg font-extrabold text-slate-100 mt-4">{SUPPORTED_STOCKS[selectedTicker]?.name}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1 font-medium">{SUPPORTED_STOCKS[selectedTicker]?.description}</p>

                    {/* CHART GENERATION RANGE */}
                    <div className="mt-8 h-36 bg-slate-950/40 rounded-2xl p-3 border border-white/[0.05] relative flex flex-col justify-between overflow-hidden">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">24-Month Historical Close Trace</span>
                      <div className="flex-1 mt-2 relative">
                        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                          {(() => {
                            const range = getStockHistoryRange(selectedTicker, gameState.currentDate, 24);
                            if (range.length < 2) return null;
                            const prices = range.map((p) => p.price);
                            const minPrice = Math.min(...prices);
                            const maxPrice = Math.max(...prices);
                            const pRange = maxPrice - minPrice || 1;

                            const linePoints = range.map((item, idx) => {
                              const x = (idx / (range.length - 1)) * 100;
                              const y = 90 - ((item.price - minPrice) / pRange) * 80;
                              return `${x},${y}`;
                            });

                            return (
                              <>
                                <path
                                  d={`M ${linePoints.join(' L ')}`}
                                  fill="none"
                                  stroke="#10b981"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                />
                                {/* grid guidance horizontal lines */}
                                <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="3 3" />
                                <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="3 3" />
                                <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="3 3" />
                              </>
                            );
                          })()}
                        </svg>
                      </div>
                      <div className="flex justify-between text-[8px] text-slate-500 mt-2 font-mono uppercase">
                        <span>Range Start</span>
                        <span>Mid Cycle</span>
                        <span>Current Day</span>
                      </div>
                    </div>
                  </div>

                  {/* MINI TRANSACTION FORM */}
                  <div className="mt-8 pt-5 border-t border-white/[0.05]">
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <span className="font-extrabold text-slate-300 uppercase tracking-widest">Share Trade Quantity</span>
                      <div className="flex items-center gap-1 bg-slate-900 rounded-xl p-1 border border-white/[0.05]">
                        <button
                          onClick={() => setTradeQuantity((v) => Math.max(1, v - 5))}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-mono font-bold text-white">{tradeQuantity}</span>
                        <button
                          onClick={() => setTradeQuantity((v) => v + 5)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2 text-xs border-b border-white/[0.05]">
                      <span className="text-slate-400">Estimated Total Capital</span>
                      <span className="font-mono font-bold text-white">
                        ${(tradeQuantity * getHistoricalPrice(selectedTicker, cYear, cMonth, cDay)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <button
                        onClick={() => executeTrade('BUY', selectedTicker)}
                        className="p-3.5 bg-emerald-500 hover:bg-emerald-400 rounded-2xl text-xs font-extrabold shadow-lg shadow-emerald-500/10 transition active:scale-95"
                      >
                        Buy Shares
                      </button>
                      <button
                        onClick={() => executeTrade('SELL', selectedTicker)}
                        className="p-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-2xl text-xs font-extrabold transition active:scale-95"
                      >
                        Sell Shares
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 4: CHRONOLOGICAL EVENTS TIMELINE */}
          {gameState.gameStatus === 'playing' && activeTab === 'events' && (
            <div className="max-w-xl mx-auto backdrop-blur-md bg-[#161d2f]/70 border border-white/[0.08] p-6 rounded-3xl flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-extrabold text-white">Experienced Life &amp; Career Events Ledger</h2>
                <p className="text-xs text-slate-400 mt-1">Chronological history of major market crashes, economic shocks and BitLife windfalls experienced.</p>
              </div>

              <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
                {gameState.eventLogs.map((log, lIdx) => (
                  <div key={lIdx} className="p-3.5 bg-slate-900 rounded-2xl border border-white/[0.05] leading-relaxed text-xs text-slate-300">
                    <span className="text-[10px] text-slate-500 block font-bold mb-1 font-mono">Ledger Row #{gameState.eventLogs.length - lIdx}</span>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN 5: EDUCATIONAL LAYER CARDS */}
          {gameState.gameStatus === 'playing' && activeTab === 'learn' && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-extrabold text-white">Investing Academy &amp; Concepts</h2>
                <p className="text-xs text-slate-400 mt-1">Interactive guide to the core principles of building generational wealth over long periods.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="backdrop-blur-md bg-[#161d2f]/70 border border-white/[0.08] p-5 rounded-3xl">
                  <div className="flex items-center gap-2 text-emerald-400 mb-2">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-xs font-extrabold uppercase tracking-widest">Core Principle 1: Diversification</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">Avoid Concentrating Capital Exclusively</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4 font-medium">
                    "Do not put all your eggs in one basket." Concentrated holdings (holding only 1 or 2 specific tech stocks) offer stellar upside if they rally but face permanent wipeouts during sector-specific bubbles. Long-term funds use low-cost Index ETFs like SPY or QQQ to buy slice representation of hundreds of organizations.
                  </p>
                  <div className="p-3.5 bg-slate-900 rounded-2xl border border-white/[0.05] text-[11px] text-teal-400">
                    <strong>Tip:</strong> Holding at least 5 unique assets triggers achievements and stabilizes simulated volatility significantly!
                  </div>
                </div>

                <div className="backdrop-blur-md bg-[#161d2f]/70 border border-white/[0.08] p-5 rounded-3xl">
                  <div className="flex items-center gap-2 text-emerald-400 mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-extrabold uppercase tracking-widest">Core Principle 2: Compound Interest</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">The Eighth Wonder of the World</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4 font-medium">
                    Compounding relies on reinvesting earned dividends and growth over continuous timelines, generating exponential charts. Even standard monthly savings of $150 added consistently over 18 simulated years forms massive leverage compared to timing intraday flash drops.
                  </p>
                  <div className="p-3.5 bg-slate-900 rounded-2xl border border-white/[0.05] text-[11px] text-teal-400">
                    <strong>Rule:</strong> The earlier you enter index positions, the larger your retirement compound cushion becomes.
                  </div>
                </div>

                <div className="backdrop-blur-md bg-[#161d2f]/70 border border-white/[0.08] p-5 rounded-3xl">
                  <div className="flex items-center gap-2 text-emerald-400 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs font-extrabold uppercase tracking-widest">Core Principle 3: Emotional Traps</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">Avoid Emotional Panic-Selling Climax</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4 font-medium">
                    GFC (2008) and Covid (2020) selloffs trigger deep emotional panic where retail players sell positions in index benchmarks. This permanently converts floating "paper losses" into real loss of precious capital. Staying disciplined and continuing to buy the dips of indices yields tremendous upside on recoveries.
                  </p>
                </div>

                <div className="backdrop-blur-md bg-[#161d2f]/70 border border-white/[0.08] p-5 rounded-3xl">
                  <div className="flex items-center gap-2 text-emerald-400 mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-extrabold uppercase tracking-widest">Core Principle 4: Human Capital</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">Your Absolute Greatest Initial Asset</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4 font-medium">
                    Your ability to produce career income represents massive financial power in your initial decade of gameplay. Standard certifications, raising wage skills, and choosing higher career-tier risks (represented on the risk profile profiles) converts labor directly into active dry investment powder.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 6: GENERAL TRANSACTION HISTORY LEDGER */}
          {gameState.gameStatus === 'playing' && activeTab === 'history' && (
            <div className="max-w-2xl mx-auto backdrop-blur-md bg-[#161d2f]/70 border border-white/[0.08] p-6 rounded-3xl flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-white">Full Transaction Ledger</h2>
                  <p className="text-xs text-slate-400 mt-1">Detailed history of executed trading and asset allocations.</p>
                </div>
                <span className="text-xs text-teal-400 font-bold">{gameState.transactions.length} Actions</span>
              </div>

              <div className="flex flex-col gap-3.5 max-h-[440px] overflow-y-auto pr-2">
                {gameState.transactions.map((txn) => (
                  <div key={txn.id} className="p-3.5 bg-slate-900 rounded-2xl border border-white/[0.04] flex items-center justify-between text-xs">
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black mr-2 ${txn.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {txn.type}
                      </span>
                      <strong className="text-white text-xs">{txn.ticker}</strong>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">Date: {txn.date} | {txn.shares} Shares @ ${txn.price}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-white font-bold">${txn.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                ))}

                {gameState.transactions.length === 0 && (
                  <div className="text-center py-10">
                    <span className="text-slate-500 text-xs font-bold block">No actions logged yet</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SCREEN 7: GAME OVER RESULTS PAGE */}
          {gameState.gameStatus === 'gameover' && (
            <div className="max-w-2xl mx-auto text-center py-8">
              <span className="px-3.5 py-1 bg-yellow-500/10 text-yellow-400 rounded-full text-xs font-bold uppercase tracking-widest block mb-1 max-w-xs mx-auto">Simulation Concluded</span>
              <h1 className="text-4xl font-black text-white mt-1">The 2025 Retrospective results</h1>
              <p className="text-xs text-slate-400 mt-2">Your 18-year financial journey starting in the ruins of 2008 has reached its final year-end climax.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* ACCUMULATION BOX */}
                <div className="backdrop-blur-md bg-[#161d2f]/70 border border-white/[0.08] p-6 rounded-3xl flex flex-col items-center justify-center">
                  <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Final Portfolio Net Wealth</span>
                  <h2 className="text-4xl font-black mt-2 text-white font-mono">${currentTotalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                  
                  {currentTotalPortfolioValue >= 1000000 ? (
                    <div className="mt-4 px-3.5 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full">
                      🏆 WIN: Reached $1,000,000+!
                    </div>
                  ) : currentTotalPortfolioValue >= 250000 ? (
                    <div className="mt-4 px-3.5 py-1 bg-teal-500/15 border border-teal-500/30 text-teal-400 text-xs font-bold rounded-full">
                      🥈 Partial Success: Comfortably Off
                    </div>
                  ) : (
                    <div className="mt-4 px-3.5 py-1 bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold rounded-full">
                      🔴 Crash Lands: Preservation Deficit
                    </div>
                  )}
                </div>

                {/* BENCHMARK RESULTS COMPARISON */}
                <div className="backdrop-blur-md bg-[#161d2f]/70 border border-white/[0.08] p-5 rounded-3xl flex flex-col justify-around text-left">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Cumulative Your Returns</span>
                    <strong className={`font-mono ${allTimeGainPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{allTimeGainPercent}%</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs py-2 border-y border-white/[0.05]">
                    <span className="text-slate-400">S&amp;P 500 (SPY) Benchmark</span>
                    <strong className="font-mono text-zinc-300">{benchmarkSpyReturn}%</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Nasdaq Group (QQQ) Benchmark</span>
                    <strong className="font-mono text-zinc-300">{benchmarkQqqReturn}%</strong>
                  </div>
                </div>
              </div>

              {/* ACHIEVEMENTS BOX */}
              <div className="backdrop-blur-md bg-[#161d2f]/70 border border-white/[0.08] p-5 rounded-3xl mt-6 text-left">
                <h3 className="text-sm font-bold text-white mb-2">Trophic Milestones &amp; Unlocks</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  {gameState.achievements.length > 0 ? (
                    gameState.achievements.map((ach) => (
                      <span key={ach} className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 rounded-lg uppercase text-[10px]">
                        {ach === 'milestone_25k' ? 'Quarter Sized' : ach === 'milestone_100k' ? 'Six Figure' : ach === 'milestone_500k' ? 'Half Million' : ach === 'diversified_pioneer' ? 'Safe Harbor' : 'Millionaire'}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">No milestone trophies completed. Try playing with more asset concentration or aggressive positions!</span>
                  )}
                </div>
              </div>

              {/* ACADEMIC RETRO SUMMARY WRAP */}
              <div className="backdrop-blur-md bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-3xl text-left mt-6">
                <h4 className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider">Educational Retrospective</h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  FinSim simulates actual micro/macro adjustments from 2008 to 2025. By allowing decisions through Lehman collapses, quantitative easing surges, and the massive NVIDIA AI boom, you experience why holding disciplined index averages or compound savings outclasses short-term trading volatility.
                </p>
              </div>

              <div className="mt-8 flex justify-center gap-4">
                <button
                  onClick={resetGame}
                  className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-xs font-bold rounded-2xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 transition active:scale-95"
                >
                  Restart Simulation Game <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* FOOTER METRICS AND COMPLIANCE */}
      <footer className="h-10 border-t border-white/[0.08] bg-[#05070a] flex items-center justify-between px-6 text-[10px] text-slate-500">
        <span>&copy; 2026 FinSim Educational Sandbox. All rights reserved.</span>
        <span>Simulating historical parameters 2008&ndash;2025. Not investment advice.</span>
      </footer>

      {/* YEAR PROGRESS RECAP MODAL DIALOG */}
      {showRecapModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-lg w-full backdrop-blur-md bg-[#161d2f]/95 border border-white/[0.12] p-6 rounded-3xl shadow-2xl flex flex-col gap-4 relative animate-in fade-in-30 zoom-in-95">
            <span className="absolute top-4 right-4 text-xs font-black text-slate-400 cursor-pointer hover:text-white" onClick={() => setShowRecapModal(false)}>✕</span>
            <div className="flex items-center gap-2 text-emerald-400">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-sm uppercase font-extrabold tracking-widest">Year Progression Summary</h3>
            </div>
            <div className="text-xs text-slate-200 leading-relaxed font-semibold whitespace-pre-line overflow-y-auto max-h-[360px] pr-2">
              {gameState.lastRecapText}
            </div>
            <button
              onClick={() => setShowRecapModal(false)}
              className="mt-2 w-full p-3.5 bg-emerald-500 hover:bg-emerald-400 text-xs font-black rounded-2xl tracking-wide uppercase transition active:scale-98"
            >
              Continue Playing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
