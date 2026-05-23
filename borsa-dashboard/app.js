let priceChart = null;
let chartData = {};

document.addEventListener('DOMContentLoaded', () => {
  loadAll();
  document.getElementById('refreshBtn').addEventListener('click', () => {
    const btn = document.getElementById('refreshBtn');
    btn.classList.add('spinning');
    loadAll().finally(() => setTimeout(() => btn.classList.remove('spinning'), 500));
  });
  setInterval(loadAll, CONFIG.REFRESH_INTERVAL);
});

async function loadAll() {
  const tasks = [
    loadCrypto(),
    loadFearGreed(),
    loadGlobalData(),
    loadCryptoChart('bitcoin'),
    loadNews()
  ];
  if (CONFIG.ALPHA_VANTAGE_KEY && CONFIG.ALPHA_VANTAGE_KEY !== 'YOUR_ALPHA_VANTAGE_API_KEY') {
    tasks.push(loadStock('AAPL'), loadStock('NVDA'));
  }
  if (CONFIG.GOOGLE_SHEET_CSV) {
    tasks.push(loadBriefing());
  }
  await Promise.allSettled(tasks);
  updateTimestamp();
}

// --- Crypto Prices ---
async function loadCrypto() {
  try {
    const url = `${CONFIG.COINGECKO_BASE}/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true&include_24hr_high=true&include_24hr_low=true&include_market_cap=true`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.bitcoin) {
      updateCryptoCard('btc', data.bitcoin);
    }
    if (data.ethereum) {
      updateCryptoCard('eth', data.ethereum);
    }
    updateMood(data);
  } catch (e) {
    console.error('Crypto load error:', e);
  }
}

function updateCryptoCard(prefix, d) {
  const price = d.usd;
  const change = d.usd_24h_change;
  const high = d.usd_24h_high;
  const low = d.usd_24h_low;

  document.getElementById(`${prefix}Price`).textContent = '$' + formatNum(price);
  const changeEl = document.getElementById(`${prefix}Change`);
  const pct = change != null ? change.toFixed(2) : '0.00';
  const isPositive = change >= 0;
  changeEl.textContent = (isPositive ? '▲' : '▼') + ' ' + Math.abs(pct) + '%';
  changeEl.className = 'card-change ' + (isPositive ? 'positive' : 'negative');

  if (high != null) document.getElementById(`${prefix}High`).textContent = '$' + formatNum(high);
  if (low != null) document.getElementById(`${prefix}Low`).textContent = '$' + formatNum(low);
}

// --- Stock Prices ---
async function loadStock(symbol) {
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${CONFIG.ALPHA_VANTAGE_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const q = data['Global Quote'];
    if (!q) return;

    const prefix = symbol.toLowerCase();
    const price = parseFloat(q['05. price']);
    const changePct = parseFloat(q['10. change percent']);
    const open = parseFloat(q['02. open']);
    const prevClose = parseFloat(q['08. previous close']);

    document.getElementById(`${prefix}Price`).textContent = '$' + formatNum(price);
    const changeEl = document.getElementById(`${prefix}Change`);
    const isPositive = changePct >= 0;
    changeEl.textContent = (isPositive ? '▲' : '▼') + ' ' + Math.abs(changePct).toFixed(2) + '%';
    changeEl.className = 'card-change ' + (isPositive ? 'positive' : 'negative');

    document.getElementById(`${prefix}Open`).textContent = '$' + formatNum(open);
    document.getElementById(`${prefix}Prev`).textContent = '$' + formatNum(prevClose);
  } catch (e) {
    console.error(`Stock ${symbol} error:`, e);
  }
}

// --- Fear & Greed Index ---
async function loadFearGreed() {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=1');
    const data = await res.json();
    const item = data.data[0];
    const value = parseInt(item.value);
    const label = translateFearGreed(item.value_classification);

    document.getElementById('fearValue').textContent = value;
    document.getElementById('fearLabel').textContent = label;
    document.getElementById('fearFill').style.width = value + '%';

    const valueEl = document.getElementById('fearValue');
    if (value <= 25) valueEl.style.color = 'var(--accent-red)';
    else if (value <= 45) valueEl.style.color = '#f97316';
    else if (value <= 55) valueEl.style.color = 'var(--accent-gold)';
    else if (value <= 75) valueEl.style.color = '#84cc16';
    else valueEl.style.color = 'var(--accent-green)';
  } catch (e) {
    console.error('Fear & Greed error:', e);
  }
}

function translateFearGreed(cls) {
  const map = {
    'Extreme Fear': 'خوف شديد',
    'Fear': 'خوف',
    'Neutral': 'محايد',
    'Greed': 'طمع',
    'Extreme Greed': 'طمع شديد'
  };
  return map[cls] || cls;
}

// --- Global Market Data ---
async function loadGlobalData() {
  try {
    const res = await fetch(`${CONFIG.COINGECKO_BASE}/global`);
    const data = await res.json();
    const d = data.data;

    const btcDom = d.market_cap_percentage.btc.toFixed(1);
    const ethDom = d.market_cap_percentage.eth.toFixed(1);
    const otherDom = (100 - parseFloat(btcDom) - parseFloat(ethDom)).toFixed(1);

    document.getElementById('btcDom').style.width = btcDom + '%';
    document.getElementById('btcDomPct').textContent = btcDom + '%';
    document.getElementById('ethDom').style.width = ethDom + '%';
    document.getElementById('ethDomPct').textContent = ethDom + '%';
    document.getElementById('otherDom').style.width = otherDom + '%';
    document.getElementById('otherDomPct').textContent = otherDom + '%';
  } catch (e) {
    console.error('Global data error:', e);
  }
}

// --- Chart ---
async function loadCryptoChart(coinId) {
  try {
    const url = `${CONFIG.COINGECKO_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${CONFIG.CHART_DAYS}`;
    const res = await fetch(url);
    const data = await res.json();
    chartData[coinId] = data.prices;
    renderChart(coinId);
  } catch (e) {
    console.error('Chart error:', e);
  }
}

function renderChart(coinId) {
  const prices = chartData[coinId];
  if (!prices) return;

  const labels = prices.map(p => {
    const d = new Date(p[0]);
    return d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
  });
  const values = prices.map(p => p[1]);

  const isUp = values[values.length - 1] >= values[0];
  const color = isUp ? '#10b981' : '#ef4444';
  const bgColor = isUp ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';

  const ctx = document.getElementById('priceChart').getContext('2d');
  if (priceChart) priceChart.destroy();

  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        borderColor: color,
        backgroundColor: bgColor,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHitRadius: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: true,
          textDirection: 'rtl',
          callbacks: {
            label: (ctx) => '$' + formatNum(ctx.parsed.y)
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(42,54,84,0.3)' },
          ticks: { color: '#6b7280', font: { family: 'Tajawal', size: 11 }, maxTicksLimit: 7 }
        },
        y: {
          grid: { color: 'rgba(42,54,84,0.3)' },
          ticks: {
            color: '#6b7280',
            font: { family: 'Tajawal', size: 11 },
            callback: (v) => '$' + formatCompact(v)
          }
        }
      },
      interaction: { intersect: false, mode: 'index' }
    }
  });
}

function switchChart(coinId, btn) {
  document.querySelectorAll('.chart-tabs .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  if (chartData[coinId]) {
    renderChart(coinId);
  } else {
    loadCryptoChart(coinId);
  }
}

// --- News ---
async function loadNews() {
  try {
    const url = `${CONFIG.COINGECKO_BASE}/search/trending`;
    const res = await fetch(url);
    const data = await res.json();

    const newsList = document.getElementById('newsList');
    const coins = data.coins || [];

    if (coins.length === 0) {
      newsList.innerHTML = '<div class="news-placeholder">لا توجد أخبار حالياً</div>';
      return;
    }

    newsList.innerHTML = '';
    document.getElementById('newsCount').textContent = coins.length;

    coins.slice(0, 8).forEach(c => {
      const coin = c.item;
      const change = coin.data?.price_change_percentage_24h?.usd;
      const isPositive = change != null && change >= 0;
      const sentimentClass = change == null ? 'sentiment-neutral' : (isPositive ? 'sentiment-positive' : 'sentiment-negative');
      const sentimentText = change == null ? 'محايد' : (isPositive ? 'صاعد' : 'هابط');

      const item = document.createElement('div');
      item.className = 'news-item';
      item.innerHTML = `
        <a href="https://www.coingecko.com/en/coins/${coin.id}" target="_blank" rel="noopener">
          ${coin.name} (${coin.symbol.toUpperCase()}) — #${coin.market_cap_rank || '?'}
        </a>
        <div class="news-meta">
          <span>السعر: $${coin.data?.price ? parseFloat(coin.data.price).toFixed(coin.data.price < 1 ? 6 : 2) : '--'}</span>
          <span class="news-sentiment ${sentimentClass}">${sentimentText} ${change != null ? Math.abs(change).toFixed(1) + '%' : ''}</span>
        </div>
      `;
      newsList.appendChild(item);
    });
  } catch (e) {
    console.error('News error:', e);
    document.getElementById('newsList').innerHTML = '<div class="news-placeholder">تعذر تحميل الأخبار</div>';
  }
}

// --- Briefing from Google Sheets ---
async function loadBriefing() {
  if (!CONFIG.GOOGLE_SHEET_CSV) return;
  try {
    const res = await fetch(CONFIG.GOOGLE_SHEET_CSV);
    const text = await res.text();
    const rows = text.trim().split('\n');
    if (rows.length < 2) return;

    const lastRow = rows[rows.length - 1];
    const cols = parseCSVRow(lastRow);

    if (cols.length >= 7) {
      document.getElementById('briefingContent').innerHTML =
        `<div style="white-space:pre-wrap">${escapeHtml(cols[6])}</div>`;
      document.getElementById('briefingTime').textContent = cols[0];
    }
  } catch (e) {
    console.error('Briefing error:', e);
  }
}

// --- Mood ---
function updateMood(cryptoData) {
  const banner = document.getElementById('moodBanner');
  const btcChange = cryptoData?.bitcoin?.usd_24h_change || 0;
  const ethChange = cryptoData?.ethereum?.usd_24h_change || 0;
  const avg = (btcChange + ethChange) / 2;

  banner.classList.remove('mood-bullish', 'mood-bearish', 'mood-neutral');

  if (avg > 2) {
    banner.classList.add('mood-bullish');
    document.getElementById('moodIcon').textContent = '🟢';
    document.getElementById('moodTitle').textContent = 'السوق في اتجاه صاعد';
    document.getElementById('moodSubtitle').textContent = `متوسط التغير: +${avg.toFixed(1)}% — زخم إيجابي في العملات الرقمية`;
  } else if (avg < -2) {
    banner.classList.add('mood-bearish');
    document.getElementById('moodIcon').textContent = '🔴';
    document.getElementById('moodTitle').textContent = 'السوق في اتجاه هابط';
    document.getElementById('moodSubtitle').textContent = `متوسط التغير: ${avg.toFixed(1)}% — ضغط بيعي على العملات الرقمية`;
  } else {
    banner.classList.add('mood-neutral');
    document.getElementById('moodIcon').textContent = '🟡';
    document.getElementById('moodTitle').textContent = 'السوق مستقر';
    document.getElementById('moodSubtitle').textContent = `متوسط التغير: ${avg >= 0 ? '+' : ''}${avg.toFixed(1)}% — حركة محدودة`;
  }
}

// --- Helpers ---
function formatNum(n) {
  if (n == null || isNaN(n)) return '--';
  if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(6);
}

function formatCompact(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(0);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function parseCSVRow(row) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (inQuotes) {
      if (ch === '"' && row[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else current += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { result.push(current.trim()); current = ''; }
      else current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function updateTimestamp() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('lastUpdate').textContent = 'آخر تحديث: ' + timeStr;
}
