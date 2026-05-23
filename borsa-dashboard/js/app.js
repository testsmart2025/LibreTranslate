var priceChart = null;
var chartCache = {};
var currentCoin = 'bitcoin';
var currentDays = 7;

document.addEventListener('DOMContentLoaded', function () {
  loadAll();
  document.getElementById('refreshBtn').addEventListener('click', function () {
    var btn = document.getElementById('refreshBtn');
    btn.classList.add('spinning');
    loadAll().finally(function () { setTimeout(function () { btn.classList.remove('spinning'); }, 600); });
  });
  setInterval(loadAll, CONFIG.REFRESH_INTERVAL);
});

function loadAll() {
  var tasks = [
    loadCrypto(),
    loadFearGreed(),
    loadGlobalData(),
    loadCryptoChart(currentCoin, currentDays),
    loadTrending()
  ];
  if (CONFIG.ALPHA_VANTAGE_KEY !== 'YOUR_ALPHA_VANTAGE_API_KEY') {
    tasks.push(loadStock('AAPL'), loadStock('NVDA'));
  }
  if (CONFIG.GOOGLE_SHEET_CSV) {
    tasks.push(loadBriefing());
  }
  return Promise.allSettled(tasks).then(function () { updateTimestamp(); });
}

/* ── Crypto ── */
function loadCrypto() {
  return fetch(CONFIG.COINGECKO_BASE + '/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true&include_24hr_high=true&include_24hr_low=true&include_24hr_vol=true')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d.bitcoin) fillCrypto('btc', d.bitcoin);
      if (d.ethereum) fillCrypto('eth', d.ethereum);
      updateMood(d);
    })
    .catch(function (e) { console.error('Crypto:', e); });
}

function fillCrypto(pre, d) {
  var price = d.usd;
  var chg = d.usd_24h_change || 0;
  var up = chg >= 0;
  document.getElementById(pre + 'Price').textContent = '$' + fmtN(price);

  var ce = document.getElementById(pre + 'Change');
  ce.innerHTML = '<span class="change-val ' + (up ? 'change-up' : 'change-down') + '">' +
    (up ? '▲' : '▼') + ' ' + Math.abs(chg).toFixed(2) + '%</span>';

  setTxt(pre + 'High', d.usd_24h_high != null ? '$' + fmtN(d.usd_24h_high) : '--');
  setTxt(pre + 'Low', d.usd_24h_low != null ? '$' + fmtN(d.usd_24h_low) : '--');
  setTxt(pre + 'Vol', d.usd_24h_vol != null ? '$' + fmtCompact(d.usd_24h_vol) : '--');
}

/* ── Stocks ── */
function loadStock(sym) {
  return fetch('https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=' + sym + '&apikey=' + CONFIG.ALPHA_VANTAGE_KEY)
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var q = d['Global Quote'];
      if (!q) return;
      var pre = sym.toLowerCase();
      var price = parseFloat(q['05. price']);
      var chg = parseFloat(q['10. change percent']);
      var up = chg >= 0;

      document.getElementById(pre + 'Price').textContent = '$' + fmtN(price);
      var ce = document.getElementById(pre + 'Change');
      ce.innerHTML = '<span class="change-val ' + (up ? 'change-up' : 'change-down') + '">' +
        (up ? '▲' : '▼') + ' ' + Math.abs(chg).toFixed(2) + '%</span>';

      setTxt(pre + 'Open', '$' + fmtN(parseFloat(q['02. open'])));
      setTxt(pre + 'Prev', '$' + fmtN(parseFloat(q['08. previous close'])));
      setTxt(pre + 'Vol', fmtCompact(parseFloat(q['06. volume'])));
    })
    .catch(function (e) { console.error('Stock ' + sym + ':', e); });
}

/* ── Fear & Greed ── */
function loadFearGreed() {
  return fetch('https://api.alternative.me/fng/?limit=1')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var item = d.data[0];
      var val = parseInt(item.value);
      var lbl = { 'Extreme Fear': 'خوف شديد', 'Fear': 'خوف', 'Neutral': 'محايد', 'Greed': 'طمع', 'Extreme Greed': 'طمع شديد' }[item.value_classification] || item.value_classification;

      document.getElementById('fearValue').textContent = val;
      document.getElementById('fearLabel').textContent = lbl;

      var arc = document.getElementById('fearArc');
      var circumference = 2 * Math.PI * 52;
      arc.style.strokeDasharray = circumference;
      arc.style.strokeDashoffset = circumference - (circumference * val / 100);

      var col;
      if (val <= 25) col = 'var(--red-500)';
      else if (val <= 45) col = '#f97316';
      else if (val <= 55) col = 'var(--gold-500)';
      else if (val <= 75) col = '#84cc16';
      else col = 'var(--green-500)';

      arc.style.stroke = col;
      document.getElementById('fearValue').style.color = col;
    })
    .catch(function (e) { console.error('Fear:', e); });
}

/* ── Global Data ── */
function loadGlobalData() {
  return fetch(CONFIG.COINGECKO_BASE + '/global')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var mc = d.data.market_cap_percentage;
      var btc = mc.btc.toFixed(1);
      var eth = mc.eth.toFixed(1);
      var other = (100 - parseFloat(btc) - parseFloat(eth)).toFixed(1);

      animateBar('btcDom', btc); setTxt('btcDomPct', btc + '%');
      animateBar('ethDom', eth); setTxt('ethDomPct', eth + '%');
      animateBar('otherDom', other); setTxt('otherDomPct', other + '%');
    })
    .catch(function (e) { console.error('Global:', e); });
}

function animateBar(id, pct) {
  setTimeout(function () { document.getElementById(id).style.width = pct + '%'; }, 100);
}

/* ── Chart ── */
function loadCryptoChart(coin, days) {
  var key = coin + '_' + days;
  if (chartCache[key]) { renderChart(chartCache[key], coin); return Promise.resolve(); }

  return fetch(CONFIG.COINGECKO_BASE + '/coins/' + coin + '/market_chart?vs_currency=usd&days=' + days)
    .then(function (r) { return r.json(); })
    .then(function (d) {
      chartCache[key] = d.prices;
      renderChart(d.prices, coin);
    })
    .catch(function (e) { console.error('Chart:', e); });
}

function renderChart(prices, coin) {
  if (!prices || !prices.length) return;

  var step = Math.max(1, Math.floor(prices.length / 120));
  var sampled = prices.filter(function (_, i) { return i % step === 0 || i === prices.length - 1; });

  var labels = sampled.map(function (p) {
    var d = new Date(p[0]);
    return d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  });
  var vals = sampled.map(function (p) { return p[1]; });

  var up = vals[vals.length - 1] >= vals[0];
  var lineColor = up ? '#22c55e' : '#ef4444';
  var fillColor = up ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)';

  var ctx = document.getElementById('priceChart').getContext('2d');
  if (priceChart) priceChart.destroy();

  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        data: vals,
        borderColor: lineColor,
        backgroundColor: fillColor,
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        pointHitRadius: 8
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: true, textDirection: 'rtl',
          backgroundColor: 'rgba(15,26,46,0.95)',
          borderColor: 'var(--border-main)', borderWidth: 1,
          titleFont: { family: 'Tajawal' }, bodyFont: { family: 'Tajawal' },
          callbacks: { label: function (ctx) { return '$' + fmtN(ctx.parsed.y); } }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(30,48,72,0.3)' }, ticks: { color: '#64748b', font: { family: 'Tajawal', size: 10 }, maxTicksLimit: 6, maxRotation: 0 } },
        y: { grid: { color: 'rgba(30,48,72,0.3)' }, ticks: { color: '#64748b', font: { family: 'Tajawal', size: 10 }, callback: function (v) { return '$' + fmtCompact(v); } } }
      },
      interaction: { intersect: false, mode: 'index' }
    }
  });
}

function switchChart(coin, btn) {
  currentCoin = coin;
  document.querySelectorAll('.ctab').forEach(function (t) { t.classList.remove('active'); });
  btn.classList.add('active');
  loadCryptoChart(coin, currentDays);
}

function switchRange(days, btn) {
  currentDays = days;
  document.querySelectorAll('.rbtn').forEach(function (t) { t.classList.remove('active'); });
  btn.classList.add('active');
  loadCryptoChart(currentCoin, days);
}

/* ── Trending ── */
function loadTrending() {
  return fetch(CONFIG.COINGECKO_BASE + '/search/trending')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var list = document.getElementById('newsList');
      var coins = d.coins || [];
      if (!coins.length) { list.innerHTML = '<div class="news-empty">لا توجد بيانات</div>'; return; }

      list.innerHTML = '';
      document.getElementById('newsCount').textContent = Math.min(coins.length, 8);

      coins.slice(0, 8).forEach(function (c) {
        var coin = c.item;
        var chg = coin.data && coin.data.price_change_percentage_24h ? coin.data.price_change_percentage_24h.usd : null;
        var up = chg != null && chg >= 0;
        var sentCls = chg == null ? 'sent-flat' : (up ? 'sent-up' : 'sent-down');
        var sentTxt = chg == null ? 'محايد' : (up ? 'صاعد ' + Math.abs(chg).toFixed(1) + '%' : 'هابط ' + Math.abs(chg).toFixed(1) + '%');
        var priceStr = coin.data && coin.data.price ? parseFloat(coin.data.price).toFixed(coin.data.price < 1 ? 6 : 2) : '--';
        var thumb = coin.thumb || '';

        var el = document.createElement('div');
        el.className = 'news-item';
        el.innerHTML =
          (thumb ? '<img class="news-icon" src="' + thumb + '" alt="" loading="lazy">' : '') +
          '<div class="news-body">' +
            '<div class="news-title"><a href="https://www.coingecko.com/en/coins/' + coin.id + '" target="_blank" rel="noopener">' +
              coin.name + ' (' + coin.symbol.toUpperCase() + ')</a></div>' +
            '<div class="news-meta">' +
              '<span>$' + priceStr + '</span>' +
              '<span>#' + (coin.market_cap_rank || '?') + '</span>' +
              '<span class="news-sent ' + sentCls + '">' + sentTxt + '</span>' +
            '</div>' +
          '</div>';
        list.appendChild(el);
      });
    })
    .catch(function (e) {
      console.error('Trending:', e);
      document.getElementById('newsList').innerHTML = '<div class="news-empty">تعذر تحميل البيانات</div>';
    });
}

/* ── Briefing ── */
function loadBriefing() {
  if (!CONFIG.GOOGLE_SHEET_CSV) return Promise.resolve();
  return fetch(CONFIG.GOOGLE_SHEET_CSV)
    .then(function (r) { return r.text(); })
    .then(function (txt) {
      var rows = txt.trim().split('\n');
      if (rows.length < 2) return;
      var cols = parseCSV(rows[rows.length - 1]);
      if (cols.length >= 7) {
        document.getElementById('briefingContent').innerHTML = '<div style="white-space:pre-wrap">' + escHtml(cols[6]) + '</div>';
        document.getElementById('briefingTime').textContent = cols[0];
      }
    })
    .catch(function (e) { console.error('Briefing:', e); });
}

/* ── Mood ── */
function updateMood(data) {
  var banner = document.getElementById('moodBanner');
  var btcChg = data && data.bitcoin ? data.bitcoin.usd_24h_change || 0 : 0;
  var ethChg = data && data.ethereum ? data.ethereum.usd_24h_change || 0 : 0;
  var avg = (btcChg + ethChg) / 2;

  banner.className = 'mood-banner';
  if (avg > 2) {
    banner.classList.add('mood-bullish');
    setTxt('moodIcon', '🟢'); setTxt('moodTitle', 'السوق في اتجاه صاعد');
    setTxt('moodSubtitle', 'متوسط التغير: +' + avg.toFixed(1) + '% — زخم إيجابي');
    setTxt('moodBadge', 'صاعد ▲');
  } else if (avg < -2) {
    banner.classList.add('mood-bearish');
    setTxt('moodIcon', '🔴'); setTxt('moodTitle', 'السوق في اتجاه هابط');
    setTxt('moodSubtitle', 'متوسط التغير: ' + avg.toFixed(1) + '% — ضغط بيعي');
    setTxt('moodBadge', 'هابط ▼');
  } else {
    banner.classList.add('mood-neutral');
    setTxt('moodIcon', '🟡'); setTxt('moodTitle', 'السوق مستقر');
    setTxt('moodSubtitle', 'متوسط التغير: ' + (avg >= 0 ? '+' : '') + avg.toFixed(1) + '% — حركة محدودة');
    setTxt('moodBadge', 'مستقر ●');
  }
}

/* ── Helpers ── */
function fmtN(n) {
  if (n == null || isNaN(n)) return '--';
  if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(6);
}

function fmtCompact(n) {
  if (n == null || isNaN(n)) return '--';
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(0);
}

function setTxt(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }

function escHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

function parseCSV(row) {
  var r = [], c = '', q = false;
  for (var i = 0; i < row.length; i++) {
    var ch = row[i];
    if (q) { if (ch === '"' && row[i + 1] === '"') { c += '"'; i++; } else if (ch === '"') q = false; else c += ch; }
    else { if (ch === '"') q = true; else if (ch === ',') { r.push(c.trim()); c = ''; } else c += ch; }
  }
  r.push(c.trim());
  return r;
}

function updateTimestamp() {
  var now = new Date();
  setTxt('lastUpdate', now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }));
}
