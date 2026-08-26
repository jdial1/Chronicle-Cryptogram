import { splashEnteredThisSession, SPLASH_ENTERED_KEY } from './splashGate';
import { sessionSet, storageSet } from './utils/safeStorage';
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
  const coins = [...document.querySelectorAll<HTMLElement>('.splash-coin')];
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
  if (!overlay) return;

  if (root && splashEnteredThisSession()) {
    document.documentElement.classList.add('splash-skipped');
    overlay.classList.add('is-gone');
    overlay.hidden = true;
    overlay.setAttribute('inert', '');
    overlay.setAttribute('aria-hidden', 'true');
    return;
  }

  root?.setAttribute('inert', '');
  void typeTitle();
  const stopCoin = people.length && places.length ? startAllCoins() : () => undefined;

  if (!enter) return;

  let struck = false;
  const strike = () => {
    if (struck) return;
    struck = true;
    enter.classList.add('is-pressed');
    window.setTimeout(() => {
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
