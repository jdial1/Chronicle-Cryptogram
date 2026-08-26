import { splashEnteredThisSession, splashPreviewMode, SPLASH_ENTERED_KEY } from './splashGate';
import { sessionSet, storageSet } from './utils/safeStorage';
const badge = new URL('./data/images/dev-badge.png', import.meta.url).href;
const badge2 = new URL('./data/images/dev-badge-2.png', import.meta.url).href;
const people = [
  new URL('./data/images/c1.png', import.meta.url).href,
  new URL('./data/images/c2.png', import.meta.url).href,
  new URL('./data/images/c3.png', import.meta.url).href,
];
const places = [
  new URL('./data/images/l1.png', import.meta.url).href,
  new URL('./data/images/l2.png', import.meta.url).href,
  new URL('./data/images/l3.png', import.meta.url).href,
];

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function typeRow(row: HTMLElement, text: string) {
  for (const ch of text) {
    const letter = document.createElement('span');
    letter.className = 'splash-title-letter';
    letter.textContent = ch;
    letter.style.setProperty('--tilt', `${(Math.random() * 1.2 - 0.6).toFixed(2)}deg`);
    letter.style.setProperty('--shift', `${(Math.random() * 0.7 - 0.35).toFixed(2)}px`);
    letter.style.setProperty('--bleed', `${(0.12 + Math.random() * 0.16).toFixed(2)}px`);
    letter.style.setProperty('--ink-weight', `${(0.66 + Math.random() * 0.34).toFixed(2)}`);
    row.appendChild(letter);
    const hitch = Math.random() < 0.08 ? 50 + Math.random() * 80 : 0;
    await wait(14 + Math.random() * 55 + hitch);
  }
}

async function typeTitle() {
  const rows = document.querySelectorAll<HTMLElement>('.splash-title-row');
  for (const [index, row] of rows.entries()) {
    if (index) await wait(70 + Math.random() * 70);
    await typeRow(row, row.dataset.text || '');
  }
}

function paintFace(img: HTMLImageElement, src: string) {
  img.classList.remove('is-ready');
  const reveal = () => {
    if (!img.naturalWidth) return;
    img.classList.add('is-ready');
  };
  img.addEventListener('load', reveal, { once: true });
  img.src = src;
  if (img.complete) reveal();
}

function takePlate(pool: string[], held: Set<string>, except = '') {
  const free = pool.filter((src) => src !== except && !held.has(src));
  const list = free.length ? free : pool.filter((src) => src !== except);
  const src = (list.length ? list : pool)[Math.floor(Math.random() * (list.length || pool.length))];
  held.add(src);
  return src;
}

function startCoin(
  coin: HTMLElement,
  front: HTMLImageElement,
  back: HTMLImageElement,
  held: Set<string>,
  interval = 2000,
  delay = 0
) {
  let lastPerson = '';
  let lastPlace = '';
  const nextPerson = () => {
    lastPerson = takePlate(people, held, lastPerson);
    return lastPerson;
  };
  const nextPlace = () => {
    lastPlace = takePlate(places, held, lastPlace);
    return lastPlace;
  };

  let showingPerson = Math.random() < 0.5;
  let frontSrc = showingPerson ? nextPerson() : nextPlace();
  let backSrc = showingPerson ? nextPlace() : nextPerson();
  let flipped = false;
  paintFace(front, frontSrc);
  paintFace(back, backSrc);

  const inner = coin.querySelector('.splash-coin-inner');
  let tick = 0;
  const arm = () => {
    tick = window.setInterval(() => {
      flipped = !flipped;
      coin.classList.toggle('is-flipped', flipped);
      showingPerson = !showingPerson;
    }, interval);
  };
  const later = delay ? window.setTimeout(arm, delay) : (arm(), 0);

  let live = true;
  inner?.addEventListener('transitionend', (event) => {
    if (!live || event.target !== inner || (event as TransitionEvent).propertyName !== 'transform') return;
    if (flipped) {
      held.delete(frontSrc);
      frontSrc = showingPerson ? nextPlace() : nextPerson();
      paintFace(front, frontSrc);
    } else {
      held.delete(backSrc);
      backSrc = showingPerson ? nextPlace() : nextPerson();
      paintFace(back, backSrc);
    }
  });

  return () => {
    live = false;
    window.clearTimeout(later);
    window.clearInterval(tick);
  };
}

function startAllCoins() {
  const held = new Set<string>();
  const coins = [...document.querySelectorAll<HTMLElement>('#splash .splash-coin')];
  const center = document.getElementById('splash-coin') as HTMLElement | null;
  const startOne = (coin: HTMLElement, index: number) => {
    const front = coin.querySelector<HTMLImageElement>('.splash-coin-face.is-front img');
    const back = coin.querySelector<HTMLImageElement>('.splash-coin-face.is-back img');
    if (!front || !back) return () => undefined;
    return startCoin(coin, front, back, held, 2000 + index * 650, 0);
  };
  const stops: Array<() => void> = [];
  if (center) stops.push(startOne(center, 1));
  const later = window.setTimeout(() => {
    coins.forEach((coin, index) => {
      if (coin === center) return;
      stops.push(startOne(coin, index));
    });
  }, 420);
  return () => {
    window.clearTimeout(later);
    for (const stop of stops) stop();
  };
}

function startTwoFaceCoin(coin: HTMLElement, frontSrc: string, backSrc: string, interval = 1600) {
  const front = coin.querySelector<HTMLImageElement>('.splash-coin-face.is-front img');
  const back = coin.querySelector<HTMLImageElement>('.splash-coin-face.is-back img');
  if (!front || !back) return () => undefined;
  paintFace(front, frontSrc);
  paintFace(back, backSrc);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => undefined;
  let flipped = false;
  const tick = window.setInterval(() => {
    flipped = !flipped;
    coin.classList.toggle('is-flipped', flipped);
  }, interval);
  return () => {
    window.clearInterval(tick);
  };
}

const DEV_HOLD_MS = 3600;
const DEV_FADE_MS = 450;

function hideDeveloperSplash(panel: HTMLElement) {
  panel.classList.add('is-gone');
  panel.hidden = true;
  panel.setAttribute('inert', '');
  panel.setAttribute('aria-hidden', 'true');
}

async function playDeveloperSplash(holdForClick = false) {
  const panel = document.getElementById('dev-splash');
  if (!panel) return;
  const coin = document.getElementById('dev-splash-coin');
  const stopDevCoin = coin ? startTwoFaceCoin(coin, badge, badge2) : () => undefined;
  if (holdForClick) {
    panel.setAttribute('role', 'button');
    panel.setAttribute('aria-label', 'Continue from OrangeTopGames');
    panel.tabIndex = 0;
    await new Promise<void>((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      panel.addEventListener('click', done, { once: true });
      panel.addEventListener('pointerup', done, { once: true });
      panel.addEventListener(
        'keydown',
        (event: KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            done();
          }
        },
        { once: true }
      );
    });
  } else {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    await wait(reduced ? 800 : DEV_HOLD_MS);
  }
  if (panel.classList.contains('is-gone')) {
    stopDevCoin();
    return;
  }
  panel.classList.add('is-leaving');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  await wait(reduced ? 0 : DEV_FADE_MS);
  stopDevCoin();
  hideDeveloperSplash(panel);
}

function markEntered() {
  sessionSet(SPLASH_ENTERED_KEY, '1');
  storageSet(SPLASH_ENTERED_KEY, '1');
  document.documentElement.classList.add('splash-skipped');
}

function dismissSplash(overlay: HTMLElement, stopCoin: () => void) {
  markEntered();
  stopCoin();
  overlay.querySelector('#splash-enter')?.classList.remove('is-pressed');
  overlay.classList.add('is-leaving');

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    overlay.classList.add('is-gone');
    overlay.hidden = true;
    overlay.setAttribute('inert', '');
    overlay.setAttribute('aria-hidden', 'true');
    document.getElementById('root')?.removeAttribute('inert');
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.dispatchEvent(new CustomEvent('chronicle-splash-enter'));
  };

  window.requestAnimationFrame(() => {
    overlay.classList.add('is-done');
    overlay.addEventListener('transitionend', (event) => {
      if (event.target === overlay) finish();
    });
    window.setTimeout(finish, 400);
  });
}

export function startSplash() {
  const overlay = document.getElementById('splash');
  const enter = document.getElementById('splash-enter');
  const root = document.getElementById('root');
  const developer = document.getElementById('dev-splash');
  const preview = splashPreviewMode();
  if (!overlay) return;

  if (preview) {
    document.documentElement.classList.add('splash-preview', `splash-preview-${preview}`);
  }

  if (root && splashEnteredThisSession()) {
    document.documentElement.classList.add('splash-skipped');
    overlay.classList.add('is-gone');
    overlay.hidden = true;
    overlay.setAttribute('inert', '');
    overlay.setAttribute('aria-hidden', 'true');
    if (developer) hideDeveloperSplash(developer);
    return;
  }

  root?.setAttribute('inert', '');
  let stopCoin = () => undefined;
  const bootGameSplash = () => {
    overlay.removeAttribute('inert');
    void typeTitle();
    stopCoin = people.length && places.length ? startAllCoins() : () => undefined;
  };

  if (preview === 'game') {
    if (developer) hideDeveloperSplash(developer);
    bootGameSplash();
  } else {
    overlay.setAttribute('inert', '');
    void playDeveloperSplash(preview === 'dev').then(bootGameSplash);
  }

  if (!enter) return;

  let struck = false;
  const strike = () => {
    if (struck) return;
    struck = true;
    enter.classList.add('is-pressed');
    window.setTimeout(() => {
      if (preview) {
        location.reload();
        return;
      }
      dismissSplash(overlay, stopCoin);
    }, 160);
  };
  enter.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    enter.classList.add('is-pressed');
    enter.setPointerCapture(event.pointerId);
  });
  enter.addEventListener('pointerup', strike);
  enter.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      strike();
    }
  });
}

startSplash();
