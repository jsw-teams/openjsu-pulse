(() => {
  const root = document.querySelector('[data-probe-dashboard]');
  if (!root) return;

  const copies = {
    'zh-tw': {
      intl: 'zh-TW',
      refresh: '重新整理',
      retry: '重新讀取',
      loading: '正在讀取最新狀態…',
      unavailable: '暫時無法讀取最新狀態，請稍後再試。',
      noServices: '目前沒有可顯示的服務。',
      historyEmpty: '尚無歷史資料',
      normalSuffix: '正常',
      status: {
        operational: '服務正常',
        degraded: '效能下降',
        down: '服務異常',
        waiting: '等待資料'
      },
      description: {
        operational: '所有服務目前正常運作。',
        degraded: '部分服務目前效能下降。',
        down: '目前沒有服務正常回應。',
        waiting: '最新狀態資料尚未發布。'
      },
      partial: '部分服務需要關注，請查看下方服務明細。',
      waiting: '等待資料',
      lastUpdated: '最近更新'
    },
    'zh-cn': {
      intl: 'zh-CN',
      refresh: '刷新',
      retry: '重新读取',
      loading: '正在读取最新状态…',
      unavailable: '暂时无法读取最新状态，请稍后重试。',
      noServices: '目前没有可显示的服务。',
      historyEmpty: '暂无历史数据',
      normalSuffix: '正常',
      status: {
        operational: '服务正常',
        degraded: '性能下降',
        down: '服务异常',
        waiting: '等待数据'
      },
      description: {
        operational: '所有服务当前正常运行。',
        degraded: '部分服务当前性能下降。',
        down: '当前没有服务正常响应。',
        waiting: '最新状态数据尚未发布。'
      },
      partial: '部分服务需要关注，请查看下方服务明细。',
      waiting: '等待数据',
      lastUpdated: '最近更新'
    },
    en: {
      intl: 'en-US',
      refresh: 'Refresh',
      retry: 'Try again',
      loading: 'Reading the latest status…',
      unavailable: 'The latest status is temporarily unavailable. Please try again later.',
      noServices: 'There are no services to display.',
      historyEmpty: 'No history yet',
      normalSuffix: 'normal',
      status: {
        operational: 'Operational',
        degraded: 'Performance degraded',
        down: 'Service unavailable',
        waiting: 'Waiting for data'
      },
      description: {
        operational: 'All services are operating normally.',
        degraded: 'Some services are experiencing degraded performance.',
        down: 'No services are responding normally right now.',
        waiting: 'The latest status data has not been published yet.'
      },
      partial: 'Some services need attention. See the service details below.',
      waiting: 'Waiting for data',
      lastUpdated: 'Last updated'
    }
  };

  const locale = String(root.dataset.probeLocale || document.documentElement.lang || 'zh-tw').toLowerCase();
  const copy = locale === 'en' || locale.startsWith('en-')
    ? copies.en
    : locale === 'zh-cn' || locale === 'zh-sg' || locale.startsWith('zh-cn-')
      ? copies['zh-cn']
      : copies['zh-tw'];
  const validStatuses = new Set(['operational', 'degraded', 'down']);
  const historyLimit = 100;
  const refreshButton = root.querySelector('[data-probe-refresh]');

  function setText(selector, value) {
    const element = root.querySelector(selector);
    if (element) element.textContent = value;
    return element;
  }

  function numberValue(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function displayNumber(value, fractionDigits = 2) {
    const number = numberValue(value);
    if (number === null) return '—';
    return number.toFixed(fractionDigits).replace(/\.?0+$/, '');
  }

  function normalizeStatus(value) {
    const status = String(value || '').toLowerCase();
    return validStatuses.has(status) ? status : 'down';
  }

  function publicName(service) {
    const candidate = String(service?.name || service?.id || '').trim();
    if (!candidate) return '—';
    const looksLikeAddress = /^(?:https?:\/\/|www\.)|^(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:[/?#:]|$)/i.test(candidate);
    return looksLikeAddress ? String(service?.id || 'Service') : candidate;
  }

  function statusLabel(status) {
    return copy.status[normalizeStatus(status)];
  }

  function historyItems(service) {
    if (!Array.isArray(service?.checks)) return [];
    return service.checks
      .map(check => {
        if (!check || typeof check !== 'object') return null;
        return {
          status: normalizeStatus(check.status),
          checkedAt: check.checkedAt || null,
          responseTime: numberValue(check.responseTime)
        };
      })
      .filter(Boolean)
      .slice(0, historyLimit);
  }

  function historyUptime(service) {
    const checks = historyItems(service);
    if (!checks.length) return numberValue(service?.uptime);
    return checks.filter(check => check.status === 'operational').length / checks.length * 100;
  }

  function overallStatus(services) {
    const statuses = services.map(service => normalizeStatus(service.status));
    if (!statuses.length) return 'waiting';
    if (statuses.some(status => status === 'operational')) return 'operational';
    if (statuses.every(status => status === 'down')) return 'down';
    return statuses.some(status => status === 'down') ? 'down' : 'degraded';
  }

  function formatTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(copy.intl, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  function setStatusPill(element, status) {
    if (!element) return;
    const normalized = normalizeStatus(status);
    const icon = element.querySelector('i');
    element.className = 'status-pill status-' + normalized;
    element.textContent = '';
    if (icon) element.append(icon);
    element.append(document.createTextNode(statusLabel(normalized)));
    element.dataset.status = normalized;
  }

  function renderHistory(element, service) {
    if (!element) return;
    element.replaceChildren();
    const checks = historyItems(service).reverse();
    const slots = Array(historyLimit).fill(null);
    checks.forEach((check, index) => {
      const position = historyLimit - checks.length + index;
      slots[position] = check;
    });
    slots.forEach(check => {
      const bar = document.createElement('span');
      bar.className = check ? 'history-bar history-' + check.status : 'history-bar history-empty';
      bar.setAttribute('aria-hidden', 'true');
      bar.title = check
        ? statusLabel(check.status) + (check.checkedAt ? ' · ' + formatTime(check.checkedAt) : '')
        : copy.historyEmpty;
      element.append(bar);
    });
  }

  function createServiceCard(service, template) {
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector('[data-service-card]');
    const status = normalizeStatus(service.status);
    card.dataset.status = status;
    card.dataset.serviceStatus = status;
    card.classList.add('status-' + status);

    const avatar = card.querySelector('[data-service-avatar]');
    if (avatar) avatar.dataset.status = status;
    const title = card.querySelector('[data-service-title]');
    if (title) title.textContent = publicName(service);
    setStatusPill(card.querySelector('[data-service-status-label]'), status);

    const latency = numberValue(service.responseTime);
    const latencyElement = card.querySelector('[data-service-latency]');
    if (latencyElement) {
      latencyElement.textContent = latency === null ? '—' : displayNumber(latency, 0) + ' ms';
    }

    const uptimeElement = card.querySelector('[data-service-uptime]');
    const historyLabel = card.querySelector('[data-history-label]');
    const uptime = historyUptime(service);
    if (uptimeElement) {
      uptimeElement.textContent = uptime === null ? '—' : displayNumber(uptime) + '%';
    }
    if (historyLabel) historyLabel.textContent = uptime === null ? '—' : displayNumber(uptime) + '%';

    renderHistory(card.querySelector('[data-service-history]'), service);
    return card;
  }

  function renderServiceList(services) {
    const list = root.querySelector('[data-service-list]');
    const template = root.querySelector('template[data-service-template]');
    if (!list || !template) return;
    list.replaceChildren();
    if (!services.length) {
      const empty = document.createElement('div');
      empty.className = 'probe-empty';
      empty.textContent = copy.noServices;
      list.append(empty);
      return;
    }
    services.forEach(service => list.append(createServiceCard(service, template)));
  }

  function aggregateUptime(services) {
    const checks = services.flatMap(historyItems);
    if (checks.length) {
      return checks.filter(check => check.status === 'operational').length / checks.length * 100;
    }
    if (!services.length) return null;
    return services.filter(service => normalizeStatus(service.status) === 'operational').length / services.length * 100;
  }

  function renderUnavailable() {
    const banner = root.querySelector('[data-overall-banner]');
    if (banner) banner.className = 'status-banner status-waiting';
    setText('[data-overall-heading]', copy.waiting);
    setText('[data-overall-label]', copy.waiting);
    setText('[data-overall-description]', copy.unavailable);
    setText('[data-last-checked]', '—');
    setText('[data-service-count]', '—');
    setText('[data-metric="services"]', '—');
    setText('[data-metric="uptime"]', '—');
    setText('[data-metric="latency"]', '—');
    const list = root.querySelector('[data-service-list]');
    if (list) {
      const error = document.createElement('div');
      error.className = 'probe-error';
      error.textContent = copy.unavailable;
      list.replaceChildren(error);
    }
    if (refreshButton) {
      refreshButton.disabled = false;
      refreshButton.textContent = copy.retry;
    }
  }

  function renderSnapshot(snapshot) {
    const services = Array.isArray(snapshot?.services) ? snapshot.services.filter(Boolean) : [];
    const overall = overallStatus(services);
    const hasAttention = services.some(service => normalizeStatus(service.status) !== 'operational');
    const banner = root.querySelector('[data-overall-banner]');
    if (banner) banner.className = 'status-banner status-' + overall;
    setText('[data-overall-heading]', copy.status[overall]);
    setText('[data-overall-label]', copy.status[overall]);
    setText('[data-overall-description]', overall === 'operational' && hasAttention ? copy.partial : copy.description[overall]);
    setText('[data-service-count]', String(services.length));
    setText('[data-metric="services"]', String(services.length));

    const uptime = aggregateUptime(services);
    setText('[data-metric="uptime"]', uptime === null ? '—' : displayNumber(uptime));
    const latencies = services.map(service => numberValue(service.responseTime)).filter(value => value !== null);
    const averageLatency = latencies.length ? latencies.reduce((sum, value) => sum + value, 0) / latencies.length : null;
    setText('[data-metric="latency"]', averageLatency === null ? '—' : displayNumber(averageLatency, 0));

    const timestamps = services.map(service => service.lastChecked).concat(snapshot?.generatedAt || []).filter(Boolean);
    const latest = timestamps.map(value => new Date(value)).filter(date => !Number.isNaN(date.getTime())).sort((a, b) => b.getTime() - a.getTime())[0];
    const lastChecked = root.querySelector('[data-last-checked]');
    if (lastChecked) {
      lastChecked.textContent = latest ? formatTime(latest.toISOString()) : '—';
      if (latest) lastChecked.dateTime = latest.toISOString();
    }

    renderServiceList(services);
    if (refreshButton) {
      refreshButton.disabled = false;
      refreshButton.textContent = copy.refresh;
    }
  }

  function snapshotUrl() {
    const repository = String(root.dataset.probeRepository || '').trim();
    if (!repository || !/^[^/]+\/[^/]+$/.test(repository)) return '/status/probes.json';
    return 'https://raw.githubusercontent.com/' + repository + '/status-data/status/probes.json?t=' + Date.now();
  }

  async function loadSnapshot() {
    if (refreshButton) {
      refreshButton.disabled = true;
      refreshButton.textContent = copy.loading;
    }
    try {
      const response = await fetch(snapshotUrl(), { cache: 'no-store' });
      if (!response.ok) throw new Error('status request failed');
      renderSnapshot(await response.json());
    } catch {
      renderUnavailable();
    }
  }

  if (refreshButton) refreshButton.addEventListener('click', loadSnapshot);
  loadSnapshot();
  window.setInterval(loadSnapshot, 60 * 1000);
})();
