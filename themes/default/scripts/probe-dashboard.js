(() => {
  const root = document.querySelector('[data-probe-dashboard]');
  if (!root) return;

  const statusLabels = {
    operational: '服务正常',
    degraded: '性能下降',
    down: '服务异常',
    waiting: '等待数据'
  };

  const statusDescriptions = {
    operational: '所有公开服务当前均正常响应。',
    degraded: '部分服务响应变慢，当前状态为性能下降。',
    down: '至少一个服务无法正常响应，当前状态为服务异常。',
    waiting: '页面正在等待 GitHub Actions 发布首次状态快照。'
  };

  const typeLabels = { http: 'HTTP', tcp: 'TCP', ping: 'PING', dns: 'DNS' };
  const bandDefinitions = {
    http: [
      { key: 'green', label: '0–3000ms', max: 3000 },
      { key: 'yellow', label: '3000–6000ms', max: 6000 },
      { key: 'red', label: '>6000ms', max: Infinity }
    ],
    ping: [
      { key: 'green', label: '0–50ms', max: 50 },
      { key: 'lime', label: '50–100ms', max: 100 },
      { key: 'yellow', label: '100–150ms', max: 150 },
      { key: 'orange', label: '150–200ms', max: 200 },
      { key: 'red', label: '>200ms', max: Infinity }
    ],
    tcp: [
      { key: 'dark-green', label: '≤50ms', max: 50 },
      { key: 'green', label: '51–100ms', max: 100 },
      { key: 'lime', label: '101–200ms', max: 200 },
      { key: 'yellow', label: '201–250ms', max: 250 },
      { key: 'orange', label: '>250ms', max: Infinity }
    ],
    dns: [
      { key: 'green', label: '0–100ms', max: 100 },
      { key: 'yellow', label: '100–500ms', max: 500 },
      { key: 'red', label: '>500ms', max: Infinity }
    ]
  };

  const query = selector => root.querySelector(selector);

  function safeClass(value, fallback = 'unknown') {
    const normalized = String(value || '').toLowerCase().replace(/[^a-z0-9-]/g, '-');
    return normalized || fallback;
  }

  function text(value, fallback = '—') {
    return value === undefined || value === null || value === '' ? fallback : String(value);
  }

  function formatTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.valueOf())) return '—';
    return new Intl.DateTimeFormat('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date).replace(',', '');
  }

  function serviceStatus(services) {
    if (!services.length) return 'waiting';
    if (services.some(service => service.status === 'down')) return 'down';
    if (services.some(service => service.status === 'degraded')) return 'degraded';
    return 'operational';
  }

  function latencyBand(type, responseTime, status) {
    if (status === 'down' || !Number.isFinite(Number(responseTime))) return { key: 'timeout', label: '超时' };
    const definitions = bandDefinitions[type] || bandDefinitions.http;
    return definitions.find(definition => Number(responseTime) <= definition.max) || definitions[definitions.length - 1];
  }

  function setStatusPill(card, status) {
    const pill = card.querySelector('[data-service-status-label]');
    if (!pill) return;
    pill.className = `status-pill status-${safeClass(status, 'degraded')}`;
    pill.replaceChildren();
    const dot = document.createElement('i');
    dot.setAttribute('aria-hidden', 'true');
    pill.append(dot, document.createTextNode(statusLabels[status] || statusLabels.degraded));
  }

  function createServiceCard(service) {
    const template = query('template[data-service-template]');
    if (!template) return null;
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector('[data-service-card]');
    if (!card) return null;
    const type = safeClass(service.type || 'http');
    card.dataset.serviceId = text(service.id, 'service');
    card.dataset.serviceType = type;
    const avatar = card.querySelector('[data-service-avatar]');
    if (avatar) avatar.className = `service-avatar service-avatar-${type}`;
    const typeIcon = card.querySelector('[data-service-type-icon]');
    if (typeIcon) typeIcon.textContent = typeLabels[type] || type.toUpperCase();
    const role = card.querySelector('[data-service-role]');
    if (role) role.textContent = text(service.role, typeLabels[type] || type.toUpperCase());
    const title = card.querySelector('[data-service-title]');
    if (title) title.textContent = text(service.name, service.id);
    const description = card.querySelector('[data-service-description]');
    if (description) {
      description.textContent = text(service.description, '');
      description.hidden = !service.description;
    }
    return card;
  }

  function checkBand(type, check, status) {
    if (check && check.band) return { key: safeClass(check.band), label: text(check.bandLabel, check.band) };
    if (status === 'operational' && !Number.isFinite(Number(check?.responseTime))) {
      return (bandDefinitions[type] || bandDefinitions.http)[0];
    }
    return latencyBand(type, check?.responseTime, status);
  }

  function renderService(card, service, historyLimit) {
    const status = statusLabels[service.status] ? service.status : 'degraded';
    const type = String(service.type || card.dataset.serviceType || 'http').toLowerCase();
    const band = service.band
      ? { key: safeClass(service.band), label: text(service.bandLabel, service.band) }
      : latencyBand(type, service.responseTime, status);
    card.dataset.serviceStatus = status;
    card.dataset.serviceBand = band.key;
    setStatusPill(card, status);

    const latency = card.querySelector('[data-service-latency]');
    if (latency) {
      latency.replaceChildren();
      if (Number.isFinite(Number(service.responseTime))) {
        latency.append(document.createTextNode(String(service.responseTime)), document.createTextNode(' '));
        const unit = document.createElement('small');
        unit.textContent = 'ms';
        latency.append(unit);
      } else {
        latency.textContent = '超时';
      }
    }
    const bandLabel = card.querySelector('[data-service-band-label]');
    if (bandLabel) {
      bandLabel.className = `status-indicator status-indicator-${safeClass(status, 'degraded')}`;
      bandLabel.textContent = statusLabels[status] || statusLabels.degraded;
      bandLabel.title = band.label;
    }
    const uptime = card.querySelector('[data-service-uptime]');
    const uptimeValue = Number(service.uptime);
    if (uptime) {
      uptime.textContent = (Number.isFinite(uptimeValue) ? uptimeValue.toFixed(2) : '—') + '%';
    }
    const historyLabel = card.querySelector('[data-history-label]');
    if (historyLabel) historyLabel.textContent = (Number.isFinite(uptimeValue) ? uptimeValue.toFixed(2) : '—') + '% 正常';
    const history = card.querySelector('[data-service-history]');
    if (history) {
      const historySlots = 100;
      const checks = Array.isArray(service.checks) ? service.checks.slice(0, historySlots).reverse() : [];
      const emptySlots = Math.max(0, historySlots - checks.length);
      const bars = Array.from({ length: historySlots }, (_, index) => {
        const bar = document.createElement('span');
        if (index < emptySlots) {
          bar.className = 'history-bar history-empty';
          bar.title = '尚无历史数据';
          return bar;
        }
        const check = checks[index - emptySlots];
        const checkStatus = typeof check === 'string' ? check : check?.status;
        const normalizedStatus = statusLabels[checkStatus] ? checkStatus : 'degraded';
        bar.className = 'history-bar history-' + safeClass(normalizedStatus, 'degraded');
        bar.title = statusLabels[normalizedStatus] || statusLabels.degraded;
        return bar;
      });
      history.replaceChildren(...bars);
    }
  }

  function checkBandFor(type, check, status) {
    if (typeof check === 'string') return status === 'down' ? { key: 'timeout', label: '超时' } : (bandDefinitions[type] || bandDefinitions.http)[0];
    return checkBand(type, check, status);
  }

  function renderServiceList(services, historyLimit) {
    const list = query('[data-service-list]');
    if (!list) return;
    list.replaceChildren();
    if (!services.length) {
      const empty = document.createElement('div');
      empty.className = 'probe-loading';
      empty.textContent = '配置中没有可展示的检测点';
      list.append(empty);
      return;
    }
    services.forEach(service => {
      const card = createServiceCard(service);
      if (!card) return;
      list.append(card);
      renderService(card, service, historyLimit);
    });
  }

  function renderRecentChecks(services) {
    const list = query('[data-recent-checks]');
    if (!list) return;
    const rows = services.flatMap(service => (Array.isArray(service.checks) ? service.checks : []).map(check => ({
      service,
      checkedAt: typeof check === 'object' ? check.checkedAt : null,
      status: typeof check === 'object' ? check.status : check,
      responseTime: typeof check === 'object' ? check.responseTime : null
    }))).filter(row => row.checkedAt).sort((left, right) => new Date(right.checkedAt) - new Date(left.checkedAt)).slice(0, 7);
    if (!rows.length) {
      list.replaceChildren();
      const empty = document.createElement('li');
      empty.className = 'probe-loading';
      empty.textContent = '等待 GitHub Actions 首次探测';
      list.append(empty);
    } else {
      list.replaceChildren(...rows.map(row => {
        const li = document.createElement('li');
        const service = document.createElement('span');
        service.className = 'recent-service';
        const status = statusLabels[row.status] ? row.status : 'degraded';
        const dot = document.createElement('i');
        dot.className = `status-dot status-dot-${safeClass(status, 'degraded')}`;
        dot.setAttribute('aria-hidden', 'true');
        const name = document.createElement('strong');
        name.textContent = text(row.service.name, row.service.id);
        service.append(dot, name);
        const time = document.createElement('time');
        time.dateTime = text(row.checkedAt, '');
        time.textContent = formatTime(row.checkedAt);
        const latency = document.createElement('span');
        latency.textContent = Number.isFinite(Number(row.responseTime)) ? `${row.responseTime} ms` : '超时';
        li.append(service, time, latency);
        return li;
      }));
    }
    const count = query('[data-check-count]');
    if (count) count.textContent = rows.length ? `${rows.length} 条记录` : '等待数据';
  }

  function renderSnapshot(snapshot) {
    const services = Array.isArray(snapshot.services) ? snapshot.services : [];
    const overall = serviceStatus(services);
    const averageLatency = services.map(service => Number(service.responseTime)).filter(Number.isFinite);
    const averageUptime = services.map(service => Number(service.uptime)).filter(Number.isFinite);
    const latest = snapshot.generatedAt || services.map(service => service.lastChecked).filter(Boolean).sort().at(-1);
    const banner = query('[data-overall-banner]');
    if (banner) banner.className = `status-banner status-${overall}`;
    const label = query('[data-overall-label]');
    if (label) label.textContent = statusLabels[overall];
    const heading = query('[data-overall-heading]');
    if (heading) heading.textContent = statusLabels[overall];
    const description = query('[data-overall-description]');
    if (description) description.textContent = statusDescriptions[overall];
    const lastChecked = query('[data-last-checked]');
    if (lastChecked && latest) {
      lastChecked.dateTime = latest;
      lastChecked.textContent = formatTime(latest);
    }
    const servicesMetric = query('[data-metric="services"]');
    if (servicesMetric) servicesMetric.textContent = String(services.length);
    const latencyMetric = query('[data-metric="latency"]');
    if (latencyMetric) latencyMetric.textContent = averageLatency.length ? String(Math.round(averageLatency.reduce((sum, value) => sum + value, 0) / averageLatency.length)) : '—';
    const uptimeMetric = query('[data-metric="uptime"]');
    if (uptimeMetric) uptimeMetric.textContent = averageUptime.length ? (averageUptime.reduce((sum, value) => sum + value, 0) / averageUptime.length).toFixed(2) : '—';
    const intervalMetric = query('[data-metric="interval"]');
    if (intervalMetric) intervalMetric.textContent = text(snapshot.intervalMinutes, '5');
    const serviceCount = query('[data-service-count]');
    if (serviceCount) serviceCount.textContent = String(services.length);
    renderServiceList(services, 100);
    const source = query('[data-probe-source]');
    if (source) source.replaceChildren(document.createTextNode(`数据来自 GitHub Actions 最近一次成功探测 · ${latest ? formatTime(latest) : '等待首次探测'}`));
  }

  function snapshotUrl() {
    const explicitUrl = String(root.dataset.probeData || '').trim();
    const repository = String(root.dataset.probeRepository || '').trim();
    const base = explicitUrl || (repository ? `https://raw.githubusercontent.com/${repository}/status-data/status/probes.json` : '/status/probes.json');
    return `${base}${base.includes('?') ? '&' : '?'}t=${Date.now()}`;
  }

  let loading = false;
  async function loadSnapshot() {
    if (loading) return;
    loading = true;
    const button = query('[data-probe-refresh]');
    if (button) {
      button.disabled = true;
      button.textContent = '读取中…';
    }
    try {
      const response = await fetch(snapshotUrl(), { cache: 'no-store' });
      if (!response.ok) throw new Error(`probe snapshot returned ${response.status}`);
      renderSnapshot(await response.json());
      if (button) button.textContent = '刷新快照';
    } catch (error) {
      console.warn('Unable to refresh probe snapshot', error);
      const source = query('[data-probe-source]');
      if (source) source.replaceChildren(document.createTextNode('暂时没有可用的动态状态快照，请等待 GitHub Actions 首次运行。'));
      if (button) button.textContent = '重试读取';
    } finally {
      loading = false;
      if (button) button.disabled = false;
    }
  }

  const refresh = query('[data-probe-refresh]');
  if (refresh) refresh.addEventListener('click', loadSnapshot);
  window.setInterval(loadSnapshot, 60_000);
  loadSnapshot();
})();
