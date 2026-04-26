const reveals = document.querySelectorAll('.reveal');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  document.body.classList.add('motion-ready');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.18
  });

  reveals.forEach((item) => revealObserver.observe(item));
}

const counter = document.querySelector('[data-counter]');

if (counter) {
  const target = Number(counter.dataset.counter);
  const duration = 1400;
  const start = performance.now();

  const animateCounter = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.floor(target * eased);

    counter.textContent = value.toLocaleString('en-US');

    if (progress < 1) {
      requestAnimationFrame(animateCounter);
    }
  };

  requestAnimationFrame(animateCounter);
}

const copyButton = document.querySelector('[data-copy-target]');

if (copyButton) {
  const target = document.getElementById(copyButton.dataset.copyTarget);
  const targetText = target ? target.textContent.trim() : '';
  const hasRealCA = targetText && !/coming|drops at launch|soon|tbd/i.test(targetText);

  if (!hasRealCA) {
    copyButton.disabled = true;
  } else {
    copyButton.textContent = 'Copy CA';

    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(targetText);
        copyButton.textContent = 'Copied';

        window.setTimeout(() => {
          copyButton.textContent = 'Copy CA';
        }, 1400);
      } catch {
        copyButton.textContent = 'Copy failed';
      }
    });
  }
}

/* Live ticker prices */

const FINNHUB_API_KEY = 'd7n8chpr01qppri3um9gd7n8chpr01qppri3uma0';

const STOCK_SYMBOLS = ['AAPL', 'NVDA', 'TSLA', 'PLTR', 'COIN', 'AMD'];

const SOLANA_MEME_COINS = [
  {
    symbol: 'BONK',
    coingeckoId: 'bonk'
  },
  {
    symbol: 'WIF',
    coingeckoId: 'dogwifcoin'
  },
  {
    symbol: 'POPCAT',
    coingeckoId: 'popcat'
  },
  {
    symbol: 'BOME',
    coingeckoId: 'book-of-meme'
  },
  {
    symbol: 'PENGU',
    coingeckoId: 'pudgy-penguins'
  },
  {
    symbol: 'WEN',
    coingeckoId: 'wen-4'
  }
];

function formatStockPrice(price) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
}

function formatCryptoPrice(price) {
  if (price >= 1) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }

  if (price >= 0.01) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    }).format(price);
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 6,
    maximumFractionDigits: 8
  }).format(price);
}

function updateTickerItem(symbol, priceText, percentChange) {
  const quoteItems = document.querySelectorAll('.quote-item');

  quoteItems.forEach((item) => {
    const symbolEl = item.querySelector('.quote-symbol');
    const priceEl = item.querySelector('.quote-price');
    const changeEl = item.querySelector('.quote-change');

    if (!symbolEl || !priceEl || !changeEl) return;

    const itemSymbol = symbolEl.textContent.trim();

    if (itemSymbol !== symbol) return;

    const isUp = Number(percentChange) >= 0;
    const sign = isUp ? '+' : '';

    priceEl.textContent = priceText;
    changeEl.textContent = `${sign}${Number(percentChange).toFixed(2)}%`;

    changeEl.classList.toggle('quote-change-up', isUp);
    changeEl.classList.toggle('quote-change-down', !isUp);
  });
}

async function fetchStockQuote(symbol) {
  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Could not fetch stock quote for ${symbol}`);
  }

  const data = await response.json();

  if (typeof data.c !== 'number' || typeof data.dp !== 'number') {
    throw new Error(`Bad stock data for ${symbol}`);
  }

  return {
    symbol,
    price: data.c,
    percentChange: data.dp
  };
}

async function updateStockTicker() {
  if (!FINNHUB_API_KEY || FINNHUB_API_KEY === 'PASTE_YOUR_FINNHUB_API_KEY_HERE') {
    console.warn('Finnhub API key is missing.');
    return;
  }

  try {
    const quotes = await Promise.all(
      STOCK_SYMBOLS.map((symbol) => fetchStockQuote(symbol))
    );

    quotes.forEach((quote) => {
      updateTickerItem(
        quote.symbol,
        formatStockPrice(quote.price),
        quote.percentChange
      );
    });
  } catch (error) {
    console.error('Stock ticker update failed:', error);
  }
}

async function updateSolanaMemeTicker() {
  try {
    const ids = SOLANA_MEME_COINS.map((coin) => coin.coingeckoId).join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_24hr_change=true`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Could not fetch Solana meme coin prices');
    }

    const data = await response.json();

    SOLANA_MEME_COINS.forEach((coin) => {
      const coinData = data[coin.coingeckoId];

      if (!coinData || typeof coinData.usd !== 'number') return;

      const percentChange = typeof coinData.usd_24h_change === 'number'
        ? coinData.usd_24h_change
        : 0;

      updateTickerItem(
        coin.symbol,
        formatCryptoPrice(coinData.usd),
        percentChange
      );
    });
  } catch (error) {
    console.error('Solana meme ticker update failed:', error);
  }
}

function updateAllTickers() {
  updateStockTicker();
  updateSolanaMemeTicker();
}

updateAllTickers();

setInterval(updateAllTickers, 15 * 60 * 1000);
