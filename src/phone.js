import { makeIcon } from './icons.js';
export { iconNames } from './icons.js';

const defaults = { base: '#a3ac89', light: '#a6bd6b', mid: '#748d4c', dark: '#4a6639' };

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(label, className, onClick) {
  const node = element('button', className);
  node.type = 'button';
  node.setAttribute('aria-label', label);
  node.addEventListener('click', onClick);
  return node;
}

/** Mount a phone in a sized container. Import the module directly in a browser. */
export function mountPhone(container, config) {
  if (!(container instanceof HTMLElement)) throw new TypeError('需要一个 HTML 容器');
  if (!Array.isArray(config?.apps) || !config.apps.length) throw new Error('至少配置一个应用');
  const apps = new Map();
  const badges = new Set();
  for (const app of config.apps) {
    if (
      !app ||
      typeof app.id !== 'string' ||
      !app.id.trim() ||
      apps.has(app.id) ||
      typeof app.label !== 'string' ||
      !app.label.trim() ||
      typeof app.render !== 'function'
    ) {
      throw new TypeError('每个应用都需要唯一的 id、label 和 render 函数');
    }
    apps.set(app.id, app);
    if (app.badge) badges.add(app.id);
  }
  if (config.widget && !apps.has(config.widget.appId)) throw new Error('widget.appId 必须指向已注册的应用');
  const host = element('div');
  host.style.cssText = 'width:100%;height:100%';
  const shadow = host.attachShadow({ mode: 'open' });
  const stylesheet = element('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = new URL('./phone.css', import.meta.url).href;
  const stage = element('section');
  stage.id = 'stage';
  stage.tabIndex = -1;
  stage.setAttribute('aria-label', config.name || '手机');
  const view = element('div');
  view.id = 'view';
  const nav = element('nav', 'system-nav');
  nav.setAttribute('aria-label', '系统导航');
  const backButton = button('返回', 'system-back', back);
  backButton.textContent = '‹';
  const homeButton = button('回到桌面', 'home-gesture', home);
  homeButton.append(element('i'));
  const lockButton = button('锁屏', 'system-lock', lock);
  lockButton.textContent = '锁屏';
  nav.append(backButton, homeButton, lockButton);
  stage.append(view, nav);
  shadow.append(stylesheet, stage);

  const history = [];
  let locked = false;
  let selected = 0;
  let scope;
  let disposed = false;
  const keys = [...apps.keys()];
  const api = Object.freeze({ open, home, back, lock, setBadge, setWallpaper, destroy });
  function clock() {
    const value = config.clock;
    if (typeof value === 'function') return value();
    return value ?? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  function updateTime() {
    for (const node of view.querySelectorAll('[data-clock]')) node.textContent = clock();
  }
  function setWallpaper(colors = defaults) {
    for (const [part, value] of Object.entries(defaults)) {
      const color = colors[part] ?? value;
      if (!CSS.supports('color', color)) throw new TypeError('壁纸颜色无效');
    }
    for (const part of Object.keys(defaults)) stage.style.setProperty('--wall-' + part, colors[part] ?? defaults[part]);
  }
  function setBadge(id, visible) {
    if (!apps.has(id)) throw new Error('未注册的应用');
    if (visible) badges.add(id);
    else badges.delete(id);
    if (!locked && !history.length && !disposed) {
      const node = view.querySelectorAll('.app')[keys.indexOf(id)];
      if (visible && !node.querySelector('.badge')) node.append(element('i', 'badge'));
      if (!visible) node.querySelector('.badge')?.remove();
      node.setAttribute('aria-label', apps.get(id).label + (visible ? '，有新通知' : ''));
    }
  }
  function open(id) {
    if (disposed) return;
    if (!apps.has(id)) throw new Error('未注册的应用 ' + id);
    locked = false;
    if (history.at(-1) !== id) history.push(id);
    selected = keys.indexOf(id);
    render();
  }
  function home() {
    if (disposed) return;
    locked = false;
    history.length = 0;
    render(true);
  }
  function back() {
    if (disposed) return;
    if (locked) return home();
    if (!history.length) return lock();
    history.pop();
    render(true);
  }
  function lock() {
    if (disposed) return;
    locked = true;
    history.length = 0;
    render(true);
  }
  function desktop() {
    const screen = element('div', 'desktop');
    const status = element('div', 'phone-status');
    const time = element('strong');
    time.dataset.clock = '';
    status.append(time);
    if (config.status) {
      const right = element('span');
      right.append(element('i'), document.createTextNode(config.status));
      status.append(right);
    }
    screen.append(status);
    if (config.widget) {
      const widget = config.widget;
      const card = button(widget.title, 'widget', () => open(widget.appId));
      const title = element('strong');
      title.append(makeIcon(widget.icon ?? 'reminders'), document.createTextNode(widget.title));
      card.append(title, element('small', '', widget.text));
      screen.append(card);
    }
    const grid = element('div', 'grid');
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', '桌面应用');
    const label = element('span', 'app-name', apps.get(keys[selected]).label);
    for (const [i, id] of keys.entries()) {
      const app = apps.get(id);
      const tile = button(app.label + (badges.has(id) ? '，有新通知' : ''), 'app', () => open(id));
      tile.title = app.label;
      tile.tabIndex = i === selected ? 0 : -1;
      tile.classList.toggle('selected', i === selected);
      tile.append(makeIcon(app.icon, app.image));
      if (badges.has(id)) tile.append(element('i', 'badge'));
      tile.addEventListener('focus', () => {
        const previous = grid.children[selected];
        previous?.classList.remove('selected');
        if (previous) previous.tabIndex = -1;
        selected = i;
        tile.classList.add('selected');
        tile.tabIndex = 0;
        label.textContent = app.label;
      });
      grid.append(tile);
    }
    screen.append(grid, label);
    return screen;
  }
  function render(focus = false) {
    scope?.abort();
    scope = new AbortController();
    const id = history.at(-1);
    stage.dataset.page = locked ? 'locked' : id === undefined ? 'home' : 'app';
    lockButton.hidden = locked;
    if (locked) {
      const screen = element('div', 'lock');
      const time = element('h1');
      time.dataset.clock = '';
      const unlock = button('解锁手机', 'unlock', home);
      unlock.textContent = '解锁手机 ↑';
      screen.append(time, unlock);
      view.replaceChildren(screen);
      if (focus) unlock.focus();
    } else if (id === undefined) {
      view.replaceChildren(desktop());
      if (focus) view.querySelector('.app.selected').focus();
    } else {
      const app = apps.get(id);
      selected = keys.indexOf(id);
      const page = element('section', 'page');
      const heading = element('header');
      const arrow = button('返回上一级', '', back);
      arrow.textContent = '‹';
      heading.append(arrow, element('h1', '', app.label));
      const body = element('div', 'page-body');
      page.append(heading, body);
      view.replaceChildren(page);
      arrow.focus({ preventScroll: true });
      app.render({ container: body, phone: api, signal: scope.signal });
    }
    updateTime();
  }
  shadow.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.target.closest('input, textarea, select, [contenteditable]')) return;
    if (event.key === 'Escape' || event.key === 'Backspace') {
      event.preventDefault();
      back();
      return;
    }
    const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 4, ArrowUp: -4 }[event.key];
    if (!delta || !event.target.closest('.app')) return;
    event.preventDefault();
    const next = (selected + (delta % keys.length) + keys.length) % keys.length;
    view.querySelectorAll('.app')[next].focus();
  });
  let startY;
  view.addEventListener(
    'touchstart',
    (event) => {
      startY = locked ? event.changedTouches[0].clientY : undefined;
    },
    { passive: true },
  );
  view.addEventListener(
    'touchend',
    (event) => {
      if (locked && startY - event.changedTouches[0].clientY > 40) home();
      startY = undefined;
    },
    { passive: true },
  );
  function destroy() {
    disposed = true;
    clearInterval(ticker);
    scope?.abort();
    host.remove();
  }
  setWallpaper(config.wallpaper);
  container.append(host);
  const ticker = setInterval(updateTime, 30000);
  render();
  return api;
}
