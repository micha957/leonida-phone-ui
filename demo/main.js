import { mountPhone } from '../src/phone.js';

function text(container, tag, value) {
  const node = document.createElement(tag);
  node.textContent = value;
  container.append(node);
  return node;
}

function action(container, label, run) {
  const button = text(container, 'button', label);
  button.type = 'button';
  button.addEventListener('click', run);
}

// 示例状态由应用自己持有。你可以在这里接入自己的存储或后端。
let note = '';
const apps = [
  {
    id: 'inbox',
    label: '收件箱',
    icon: 'messages',
    badge: true,
    render({ container, phone }) {
      phone.setBadge('inbox', false);
      text(container, 'h2', '周六见');
      text(container, 'p', '记得带上速写本。见面地点我放进备忘录了。');
      action(container, '打开备忘录', () => phone.open('notes'));
    },
  },
  {
    id: 'notes',
    label: '备忘录',
    icon: 'news',
    render({ container }) {
      const label = text(container, 'label', '周末清单');
      const input = document.createElement('textarea');
      input.value = note;
      input.placeholder = '在这里记一笔…';
      input.addEventListener('input', () => {
        note = input.value;
      });
      label.append(input);
    },
  },
  {
    id: 'contacts',
    label: '通讯录',
    icon: 'contacts',
    render({ container }) {
      text(container, 'h2', '林一');
      text(container, 'p', '速写小组 · 周六上午十点');
    },
  },
  {
    id: 'colors',
    label: '色板',
    icon: 'gallery',
    render({ container, phone }) {
      text(container, 'p', '选择桌面壁纸');
      action(container, '鼠尾草绿', () => {
        phone.setWallpaper();
        phone.home();
      });
      action(container, '暮紫', () => {
        phone.setWallpaper({ base: '#c6a9b5', light: '#dba3bb', mid: '#ae748f', dark: '#79566f' });
        phone.home();
      });
    },
  },
  {
    id: 'weather',
    label: '天气',
    icon: 'weather',
    render({ container }) {
      text(container, 'h2', '24° · 晴');
      text(container, 'p', '午后微风，适合去公园画画。');
    },
  },
  {
    id: 'reminders',
    label: '提醒事项',
    icon: 'reminders',
    render({ container, phone }) {
      text(container, 'h2', '周末计划');
      action(container, '查看周六的留言', () => phone.open('inbox'));
    },
  },
  {
    id: 'clock',
    label: '时钟',
    icon: 'feed',
    render({ container, signal }) {
      const display = text(container, 'h2', '');
      const tick = () => {
        display.textContent = new Date().toLocaleTimeString();
      };
      tick();
      const timer = setInterval(tick, 1000);
      signal.addEventListener('abort', () => clearInterval(timer), { once: true });
    },
  },
  {
    id: 'settings',
    label: '设置',
    icon: 'settings',
    render({ container, phone }) {
      action(container, '更换桌面配色', () => phone.open('colors'));
      action(container, '锁定屏幕', () => phone.lock());
    },
  },
];

mountPhone(document.querySelector('#phone'), {
  name: '周末手机',
  status: '24°',
  widget: { title: '提醒事项', text: '周六 · 速写小组', appId: 'reminders' },
  apps,
});
