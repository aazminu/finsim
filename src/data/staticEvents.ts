/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameEvent, StockTicker, EventCategory, ChoiceOption } from '../types';

// Let's first define real-world historical market and economic shock news events.
export const HISTORICAL_MARKET_EVENTS: { [year: number]: { [month: number]: GameEvent } } = {
  2008: {
    3: {
      id: 'hist_2008_bear_stearns',
      date: '2008-03-15',
      category: 'economic',
      title: 'Bear Stearns Collapses!',
      description: 'Investment bank Bear Stearns is salvaged by JPMorgan Chase in an emergency fire sale for just $2/share backstopped by the Federal Reserve. Panic is beginning to brew on Wall Street.',
      cashImpact: 0,
      educationalTip: 'Liquidity crises in major financial institutions are leading indicators of deep systemic recessions. Safe-haven positions like CASH or heavy giants might buffer the hit.',
    },
    9: {
      id: 'hist_2008_lehman',
      date: '2008-09-15',
      category: 'economic',
      title: 'Lehman Brothers Files Bankruptcy!',
      description: 'The global financial crisis triggers a historic climax. Lehman Brothers collapses, sending shockwaves through global markets. Credit freezes and stock indices plummet. You feel the financial panic.',
      cashImpact: -1500, // Emergency spending or general salary squeeze
      educationalTip: 'Emotional selling during systemic crises converts paper losses into permanent losses. Diversified ETFs like SPY suffer, but historically they recover over long cycles.',
    },
  },
  2009: {
    3: {
      id: 'hist_2009_bottom',
      date: '2009-03-09',
      category: 'market',
      title: 'The S&P 500 Hits the Bottom!',
      description: 'S&P 500 drops to a closing low of 676. Wall Street sentiment is at maximum dread. Fictional pundits claim corporate America is finished. Meanwhile, the Federal Reserve continues pumping massive quantitative easing (QE). Is this the ultimate buying opportunity?',
      cashImpact: 0,
      educationalTip: 'Market timing is notoriously difficult. Buying when there is maximum "blood on the streets" is a classic value investing strategy championed by Warren Buffett.',
    },
  },
  2010: {
    5: {
      id: 'hist_2010_flash_crash',
      date: '2010-05-06',
      category: 'market',
      title: 'The Great Flash Crash',
      description: 'High-frequency trading algorithms trigger a sudden 1,000-point (9%) drop on the Dow in minutes, only to bounce back 20 minutes later. The market is recovering, but investors are rattled by high tech.',
      cashImpact: 0,
      educationalTip: 'Flash crashes show the impact of algorithmic high-frequency trading. Long-term investors bypass intraday micro-panic to avoid being stopped out.',
    },
    6: {
      id: 'hist_2010_tesla_ipo',
      date: '2010-06-29',
      category: 'company',
      title: 'Tesla Motors (TSLA) IPO Begins!',
      description: 'Tesla debuts on the Nasdaq, raising $226 million at split-adjusted $1.13 per share. It is the first American automaker to go public since Ford in 1956. Analysts call electric vehicles a niche gimmick for high-income treehuggers. Will Elon prove them wrong?',
      cashImpact: 0,
      educationalTip: 'IPO stock buys are highly speculative, but concentrated bets on revolutionary tech giants in their early stages yield astronomical multi-bagger returns.',
    },
  },
  2011: {
    8: {
      id: 'hist_2011_rating_downgrade',
      date: '2011-08-05',
      category: 'economic',
      title: 'US Credit Rating Downgraded!',
      description: 'S&P downgrades the United States sovereign AAA credit rating for the first time in history amid political gridlock on the debt ceiling. Gold prices rally; equities tumble.',
      cashImpact: 0,
      educationalTip: 'Even during US debt downgrades, treasury notes often rally as investors seek liquid assets during volatility, demonstrating the flight-to-safety phenomenon.',
    },
  },
  2012: {
    5: {
      id: 'hist_2012_fb_ipo',
      date: '2012-05-18',
      category: 'company',
      title: 'Facebook (META) IPO Disruption',
      description: 'Mark Zuckerberg leads Facebook to a highly anticipated $100 Billion IPO pricing at $38. However, technical Nasdaq glitches and massive retail disillusionment send the stock sliding 40% over subsequent months.',
      cashImpact: 0,
      educationalTip: 'High-publicity IPOs are often overpriced due to heavy hype and lockup expirations. Waiting 6-12 months can yield much safer entries.',
    },
  },
  2013: {
    10: {
      id: 'hist_2013_tsla_model_s',
      date: '2013-10-22',
      category: 'company',
      title: 'Tesla Model S Wins "Car of the Year"',
      description: 'The Model S receives unprecedented 99 out of 100 on Consumer Reports and MotorTrend Car of the Year. Short-sellers are decimated. Tesla stock surges over 300% in 2013 alone.',
      cashImpact: 0,
      educationalTip: 'Short squeezes occur when negative traders are forced to buy back shares of a high-growth company that successfully proves its production capability.',
    },
  },
  2015: {
    8: {
      id: 'hist_2015_china_devaluation',
      date: '2015-08-11',
      category: 'economic',
      title: 'China Devalues Yuan, Stocks Plummet!',
      description: 'China surprises the world by devaluing the Yuan, triggering global commodity slides and fears of an emerging market slowdown. Wall Street undergoes a sharp 10% August correction.',
      cashImpact: -400, // travel inflation or supply cost increases
      educationalTip: 'Global macro economies are highly interconnected. Currency adjustments in the world\'s largest manufacturing hubs trigger domestic interest volatility quickly.',
    },
  },
  2018: {
    12: {
      id: 'hist_2018_fed_tightening',
      date: '2018-12-18',
      category: 'economic',
      title: 'Jay Powell\'s Rate Hikes Spark Sell-Off',
      description: 'The Federal Reserve hikes interest rates again and notes their balance sheet reduction is on "auto-pilot". Tech stocks slide into a mini-bear market. Dec 2018 becomes the worst month since 1931.',
      cashImpact: 0,
      educationalTip: 'Central bank quantitative tightening (raising rates) sucks liquidity out of asset valuations. It acts as gravitation on high P/E tech stocks.',
    },
  },
  2020: {
    3: {
      id: 'hist_2020_covid_crash',
      date: '2020-03-12',
      category: 'economic',
      title: 'COVID-19 Pandemic Triggers Market Crash!',
      description: 'Global COVID lockdowns trigger maximum health panic. The S&P plunges 12% in a single day, halting trading multiple times on circuit-breakers. Travel stocks fall 70% and work-from-home booms.',
      cashImpact: -1200, // Health preparedness costs
      educationalTip: 'Black Swan events are completely unpredictable triggers. Investors who hold cash or maintain emergency funds are protected from forced Liquidations at market lows.',
    },
    8: {
      id: 'hist_2020_tech_booster',
      date: '2020-08-31',
      category: 'market',
      title: 'Work From Home Tech Boom!',
      description: 'Massive federal stimulus checks meet work-from-home retail demand. Apple, Microsoft, Amazon, and Zoom cross astronomical heights. Retail trading surges as sports betters turn to stock platforms.',
      cashImpact: 1200, // Fictional stimulus check reward inside the simulator!
      educationalTip: 'Liquidity, retail stimulus, and zero commission rates can trigger incredible speculative bubbles in hyper-growth tech assets.',
    },
  },
  2021: {
    1: {
      id: 'hist_2021_meme_mania',
      date: '2021-01-27',
      category: 'opportunity',
      title: 'Meme Stock Frenzy & WallStreetBets!',
      description: 'A historic retail investor rebellion on Reddit short-squeezes GameStop, AMC and drives immense speculation. Retail platforms restrict trading, fueling fury. Heavy margin positions are wiped out.',
      cashImpact: 0,
      educationalTip: 'Meme bubbles are driven by momentum and social sentiment, not valuations. While overnight multi-baggers are exciting, late entrants often face capital wipeouts of 90% or more.',
    },
  },
  2022: {
    6: {
      id: 'hist_2022_inflation_hikes',
      date: '2022-06-15',
      category: 'economic',
      title: 'US Inflation Hits 40-Year High (9.1%!)',
      description: 'Inflation is sticky and rising. The Federal Reserve embarks on intense 75bps rate hikes. Bond markets suffer; mega tech slides 30%-50% as discount models recalibrate.',
      cashImpact: -800, // Increased general living expenses
      educationalTip: 'Rising inflation decreases purchasing power while rising rates raise the risk-free rate of return, squeezing stock equity valuations.',
    },
  },
  2023: {
    11: {
      id: 'hist_2023_ai_boom',
      date: '2023-11-20',
      category: 'company',
      title: 'The AI Revolution is Born',
      description: 'OpenAI triggers a global artificial intelligence gold rush. Demand for advanced machine learning silicon reaches unbelievable levels. Nvidia (NVDA) stock erupts, crushing shorter-term bears completely.',
      cashImpact: 0,
      educationalTip: 'Disruptive technology shifts (Internet, Smartphones, AI) can trigger massive capital reallocations towards hardware infrastructure bottlenecks like GPU designers.',
    },
  },
  2024: {
    6: {
      id: 'hist_2024_nvda_split',
      date: '2024-06-07',
      category: 'company',
      title: 'NVIDIA Completes 10-for-1 Split!',
      description: 'Nvidia\'s market cap breaches $3 Trillion, briefly surpassing Microsoft and Apple as the most valuable company in the world. It completes a blockbusting stock split to make shares accessible to retail.',
      cashImpact: 0,
      educationalTip: 'Stock splits do not change the fundamental value of a company; think of it as slicing a pizza into 10 smaller slices. However, it increases trading access and signals corporate health.',
    },
  },
  2025: {
    10: {
      id: 'hist_2025_continuation',
      date: '2025-10-15',
      category: 'market',
      title: '2025 Market Peak Dynamics',
      description: 'The stock market continues hovering near record highs on steady earnings, despite ongoing trade and geopolitical concerns. Investors debate whether rate-cut cycles will solidify a soft landing.',
      cashImpact: 500, // End of year salary bump
      educationalTip: 'At market peaks, sticking to dollar-cost averaging and maintaining high asset diversification controls risk from late-cycle corrections.',
    },
  }
};

// Randomized BitLife style events
export const RANDOM_LIFE_EVENTS: {
  category: EventCategory;
  title: string;
  description: string;
  cashImpact: number;
  stockMultiplierImpact?: { ticker: StockTicker; factor: number };
  choiceOptions?: ChoiceOption[];
  educationalTip?: string;
}[] = [
  {
    category: 'life',
    title: 'Family Inheritance!',
    description: 'Your eccentric Great Aunt Shirley passed away and left you a surprise cash legacy in her will, provided you use it to build your futures.',
    cashImpact: 2500,
    educationalTip: 'Windfalls provide excellent opportunities to dollar-cost average into index ETFs to jump-start long-term compound growth.',
  },
  {
    category: 'badluck',
    title: 'Emergency Dental Surgery',
    description: 'A sudden, agonizing wisdom tooth infection forces you to get emergency extraction. Ouch! Your dental insurance only covers a fraction of the cost.',
    cashImpact: -1200,
    educationalTip: 'Maintaining an emergency cash fund (e.g., 3-6 months of expenses) prevents you from being forced to panic-sell stocks during downturns.',
  },
  {
    category: 'career',
    title: 'Workplace Promotion!',
    description: 'Your relentless hard work and late nights have paid off. Your manager hands you a glossy promotion document with a cash bonus and an increased monthly saving capacity.',
    cashImpact: 3000,
    educationalTip: 'Investing your raises and bonuses instead of increasing your lifestyle spending is called avoiding "lifestyle creep" and accelerates retirement goals.',
  },
  {
    category: 'badluck',
    title: 'Transmission Blew Up',
    description: 'Your car makes a terrible grinding noise on the highway. The mechanic calls back with bad news: your transmission needs a full replacement to pass inspection.',
    cashImpact: -1800,
    educationalTip: 'Active transportation costs can be volatile emergency liabilities. Budgeting for auto depreciation keeps cash reserves robust.',
  },
  {
    category: 'opportunity',
    title: 'The "Hot Tip" Speculation',
    description: 'A friend at a coffee shop whispers that they heard Apple (AAPL) is developing a top-secret mixed reality headset that will replace smartphones. They urge you to go all-in.',
    cashImpact: 0,
    choiceOptions: [
      {
        id: 'spec_apple_all_in',
        text: 'Ignore the hype and stick to your balanced diversification plan.',
        descriptionOutcome: 'You stay safe. Apple stock fluctuates naturally, but you avoid emotional trading traps of chasing hot tips.',
        cashImpact: 0,
      },
      {
        id: 'spec_apple_buy_dip',
        text: 'Deploy $1,500 of emergency cash directly to buy more Apple shares right now!',
        descriptionOutcome: 'Speculation loaded! You buy Apple shares. Hope the product announcement is successful.',
        cashImpact: -1500,
        stockMultiplierImpact: { ticker: 'AAPL', factor: 1.05 } as any,
      }
    ],
    educationalTip: 'Investing based on rumors or rumors from friends is a form of speculation. Standard investment strategy prioritizes public earnings, valuations, and balance sheet strength.',
  },
  {
    category: 'opportunity',
    title: 'Cryptic Forum Posts & High Hype',
    description: 'Dog-themed internet tickers are trend-pumping on forums. A local influencer claims it is the future of international currency and is guaranteed to go to the moon.',
    cashImpact: 0,
    choiceOptions: [
      {
        id: 'meme_avoid',
        text: 'Ignore the hype. This is purely speculative gambling.',
        descriptionOutcome: 'You avoid the bubble. Your peers later panic-sell as the coin drops 75% in 48 hours.',
        cashImpact: 0,
      },
      {
        id: 'meme_risk',
        text: 'Gamble $500 on the coin. High risk, high adrenaline!',
        descriptionOutcome: 'Casino mode! The coin surges 5x, then collapses. You manage to escape with a tiny cash profit!',
        cashImpact: 400,
      }
    ],
    educationalTip: 'Speculative assets lack underlying cash flows or book value. They are driven entirely by Greater Fool Theory — relying on someone else to buy at a higher price.',
  },
  {
    category: 'life',
    title: 'Tax Refund Jackpot',
    description: 'An error on your prior taxes leads to a pleasant surprise letter from the IRS along with an elegant paper refund check!',
    cashImpact: 800,
    educationalTip: 'A tax refund is actually an interest-free loan you made to the government. Adjusting your withholdings lets you invest that cash month-by-month instead.',
  },
  {
    category: 'career',
    title: 'Professional Educational Courses',
    description: 'You are offered an intensive professional coding and finance certification. It costs $1,000 up front, but promises higher long-term career earnings.',
    cashImpact: 0,
    choiceOptions: [
      {
        id: 'course_ignore',
        text: 'Decline to save your cash balance.',
        descriptionOutcome: 'You keep your $1,000 cash, but pass up the career multiplier.',
        cashImpact: 0,
      },
      {
        id: 'course_buy',
        text: 'Invest $1,000 in your personal human capital.',
        descriptionOutcome: 'Certification completed! You get a promotion and an immediate $1,500 raise/bonus in subsequent weeks.',
        cashImpact: 500, // net positive
      }
    ],
    educationalTip: 'Your greatest wealth-generating asset is your human capital (your ability to earn an income). Investing in skills yields major risk-free returns.',
  },
  {
    category: 'badluck',
    title: 'Water Heater Rupture',
    description: 'You wake up to a cold shower and a flooded basement. The plumber charges a high premium to install a new energy-efficient tank.',
    cashImpact: -1400,
    educationalTip: 'Real estate and home maintenance costs are recurring capital expenditures that must be planned as cash liabilities.',
  },
  {
    category: 'opportunity',
    title: 'Emergency Side Hustle Freelancing',
    description: 'An old contact asks if you can do emergency consulting on weekends. It is exhausting work, but pays cash immediately.',
    cashImpact: 0,
    choiceOptions: [
      {
        id: 'hustle_decline',
        text: 'Decline to preserve your mental health and relax.',
        descriptionOutcome: 'You enjoy your weekends. Good mental state, no financial change.',
        cashImpact: 0,
      },
      {
        id: 'hustle_accept',
        text: 'Grind through the weekend. Let\'s secure the bag!',
        descriptionOutcome: 'You work tirelessly and accumulate some extra investment dry powder!',
        cashImpact: 1600,
      }
    ],
    educationalTip: 'Adding active income streams (side hustles) during market recessions allows you to buy assets at deep discount valuations.',
  }
];

// Helper to generate a random event based on current conditions
export function getRandomLifeEvent(currentDateStr: string, activeTickers: string[]): GameEvent {
  const randomIndex = Math.floor(Math.random() * RANDOM_LIFE_EVENTS.length);
  const template = RANDOM_LIFE_EVENTS[randomIndex];

  // Map template into standard GameEvent interface
  const resolvedEvent: GameEvent = {
    id: `rand_${Date.now()}_${randomIndex}`,
    date: currentDateStr,
    category: template.category,
    title: template.title,
    description: template.description,
    cashImpact: template.cashImpact,
    stockMultiplierImpact: template.stockMultiplierImpact,
    choiceOptions: template.choiceOptions,
    educationalTip: template.educationalTip,
  };

  return resolvedEvent;
}
