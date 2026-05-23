const CONFIG = {
  // CoinGecko API (free tier works without key)
  COINGECKO_BASE: 'https://api.coingecko.com/api/v3',

  // Alpha Vantage API Key - ضع مفتاحك هنا
  ALPHA_VANTAGE_KEY: 'YOUR_ALPHA_VANTAGE_API_KEY',

  // Google Sheets (Published CSV URL) - انشر الشيت كـ CSV وضع الرابط هنا
  // File > Share > Publish to web > CSV
  GOOGLE_SHEET_CSV: '',

  // Crypto symbols to track
  CRYPTO_IDS: ['bitcoin', 'ethereum'],

  // Stock symbols to track
  STOCK_SYMBOLS: ['AAPL', 'NVDA'],

  // Auto-refresh interval (milliseconds) - default 5 minutes
  REFRESH_INTERVAL: 5 * 60 * 1000,

  // Chart days
  CHART_DAYS: 7
};
