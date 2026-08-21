import { useId, useMemo, type ComponentType, type SVGProps } from 'react';
import type { IconType } from 'react-icons';
import {
  GiAnticlockwiseRotation,
  GiCalendar,
  GiCheckMark,
  GiCheckedShield,
  GiCrossMark,
  GiCycle,
  GiEnvelope,
  GiFairyWand,
  GiFastArrow,
  GiHazardSign,
  GiHelp,
  GiHistogram,
  GiKeyboard,
  GiLaurelCrown,
  GiLightBulb,
  GiMagnifyingGlass,
  GiMedal,
  GiNewspaper,
  GiOpenBook,
  GiPadlock,
  GiPadlockOpen,
  GiPapers,
  GiPlainArrow,
  GiPocketWatch,
  GiQuillInk,
  GiSandsOfTime,
  GiSkeletonKey,
  GiSparkles,
  GiThreeFriends,
  GiTiedScroll,
  GiWaxSeal,
} from 'react-icons/gi';
import { WOODCUTS, WOODCUT_INK } from './woodcuts';

type InkProps = SVGProps<SVGSVGElement>;

function ink(Icon: IconType, extraClass = ''): ComponentType<InkProps> {
  const Svg = Icon as ComponentType<InkProps>;
  return ({ className = '', ...props }) => (
    <Svg
      className={`block shrink-0 ${extraClass} ${className}`.trim()}
      aria-hidden
      focusable="false"
      {...props}
      fill="currentColor"
    />
  );
}

export const X = ink(GiCrossMark);
export const Trophy = ink(GiLaurelCrown);
export const Search = ink(GiMagnifyingGlass);
export const Shield = ink(GiCheckedShield);
export const ShieldCheck = ink(GiWaxSeal);
export const RefreshCw = ink(GiCycle);
export const Send = ink(GiEnvelope);
export const CheckCircle = ink(GiCheckMark);
export const CheckCircle2 = ink(GiCheckMark);

export function DecodedStamp({ size = 'card' }: { size?: 'board' | 'card' }) {
  const board = size === 'board';
  const uid = useId().replace(/:/g, '');
  const gritId = `stamp-grit-${uid}`;
  const pose = useMemo(() => {
    const tilt = 10 + Math.random() * 14;
    return {
      left: board ? 24 + Math.random() * 52 : 34 + Math.random() * 32,
      top: board ? 26 + Math.random() * 48 : 34 + Math.random() * 32,
      rotate: (Math.random() < 0.5 ? -tilt : tilt),
    };
  }, [board]);

  return (
    <span
      aria-hidden
      className="decoded-stamp absolute z-20"
      style={{
        left: `${pose.left}%`,
        top: `${pose.top}%`,
        transform: `translate(-50%, -50%) rotate(${pose.rotate}deg)`,
      }}
    >
      <svg
        viewBox="0 0 260 80"
        className={board ? 'w-[23.125rem]' : 'w-[8.4375rem]'}
        fill="none"
      >
        <defs>
          <filter
            id={gritId}
            x="-8%"
            y="-22%"
            width="116%"
            height="144%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence type="fractalNoise" baseFrequency={board ? '0.82' : '0.74'} numOctaves="4" seed="8" result="grit" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="grit"
              scale={board ? 1.4 : 1.15}
              xChannelSelector="R"
              yChannelSelector="G"
              result="broken"
            />
            <feColorMatrix
              in="grit"
              type="matrix"
              values={
                board
                  ? '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.45 1.18'
                  : '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.22 1.22'
              }
              result="stipple"
            />
            <feComposite in="broken" in2="stipple" operator="in" result="inked" />
            <feTurbulence type="fractalNoise" baseFrequency="0.038 0.06" numOctaves="2" seed="3" result="blotch" />
            <feColorMatrix
              in="blotch"
              type="matrix"
              values={
                board
                  ? '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.15 1.08'
                  : '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.88 1.14'
              }
              result="starve"
            />
            <feComposite in="inked" in2="starve" operator="in" result="pad" />
            <feMorphology in="pad" operator="dilate" radius={board ? 0.2 : 0.16} result="bled" />
            <feComponentTransfer in="bled">
              <feFuncA type="linear" slope="2" intercept="0" />
            </feComponentTransfer>
          </filter>
        </defs>
        <g filter={`url(#${gritId})`} stroke="currentColor" fill="currentColor">
          <path d="M24 9.2 H236" strokeWidth="3.3" strokeLinecap="square" />
          <path d="M251.2 22 V58" strokeWidth="3.3" strokeLinecap="square" />
          <path d="M236 70.8 H24" strokeWidth="3.3" strokeLinecap="square" />
          <path d="M8.8 58 V22" strokeWidth="3.3" strokeLinecap="square" />
          <path d="M8.8 17.5 L18 9.2" strokeWidth="3.1" strokeLinecap="square" />
          <path d="M242 9.2 L251.2 18.5" strokeWidth="3.1" strokeLinecap="square" />
          <path d="M251.2 61.5 L241.5 70.8" strokeWidth="3.1" strokeLinecap="square" />
          <path d="M18 70.8 L8.8 61.2" strokeWidth="3.1" strokeLinecap="square" />
          <path d="M30 19.6 H230" strokeWidth="1.7" strokeLinecap="square" />
          <path d="M240.4 28.5 V51.5" strokeWidth="1.7" strokeLinecap="square" />
          <path d="M230 60.4 H30" strokeWidth="1.7" strokeLinecap="square" />
          <path d="M19.6 51.5 V28.5" strokeWidth="1.7" strokeLinecap="square" />
          <path d="M19.6 25.8 L27.2 19.6" strokeWidth="1.6" strokeLinecap="square" />
          <path d="M232.8 19.6 L240.4 26.4" strokeWidth="1.6" strokeLinecap="square" />
          <path d="M240.4 53.8 L232.5 60.4" strokeWidth="1.6" strokeLinecap="square" />
          <path d="M27.5 60.4 L19.6 53.4" strokeWidth="1.6" strokeLinecap="square" />
          <text
            x="130"
            y="48"
            textAnchor="middle"
            fill="currentColor"
            stroke="none"
            fontFamily="Cinzel, 'Arial Narrow', sans-serif"
            fontWeight="900"
            fontSize="26"
            letterSpacing="1.1"
          >
            SOLVED
          </text>
        </g>
      </svg>
    </span>
  );
}
export const Award = ink(GiMedal);
export const Zap = ink(GiPocketWatch);
export const Users = ink(GiThreeFriends);
export const TrendingUp = ink(GiHistogram);
export const Lock = ink(GiPadlock);
export const Unlock = ink(GiPadlockOpen);
export const FileText = ink(GiTiedScroll);
export const Delete = ink(GiCrossMark);
export const Lightbulb = ink(GiLightBulb);
export const CheckSquare = ink(GiCheckMark);
export const RotateCcw = ink(GiAnticlockwiseRotation);
export const Keyboard = ink(GiKeyboard);
export const BookOpen = ink(GiOpenBook);
export const Key = ink(GiSkeletonKey);
export const Sparkles = ink(GiSparkles);
export const BarChart3 = ink(GiHistogram);
export const HelpCircle = ink(GiHelp);
export const Newspaper = ink(GiNewspaper);
export const Calendar = ink(GiCalendar);
export const Wand2 = ink(GiFairyWand);
export const Type = ink(GiQuillInk);
export const AlertCircle = ink(GiHazardSign);
export const Loader2 = ink(GiSandsOfTime);
export const Copy = ink(GiPapers);
export const Check = ink(GiCheckMark);
export const ArrowRight = ink(GiFastArrow);
export const ChevronDown = ink(GiPlainArrow, 'rotate-180');
export const ChevronUp = ink(GiPlainArrow);
export const ChevronLeft = ink(GiPlainArrow, 'rotate-90');
export const ChevronRight = ink(GiPlainArrow, '-rotate-90');

function WoodcutHatch({
  id,
  stroke,
  dense = false,
}: {
  id: string;
  stroke: string;
  dense?: boolean;
}) {
  return (
    <pattern
      id={id}
      patternUnits="userSpaceOnUse"
      width={dense ? 10 : 14}
      height={dense ? 13 : 18}
      patternTransform="rotate(-17)"
    >
      <g fill="none" stroke={stroke} strokeLinecap="square">
        <path
          d={dense ? 'M-0.4 1.6 H10.8' : 'M-0.6 1.7 C3.4 0.8 8.2 2.5 14.8 1.5'}
          strokeWidth={dense ? 2.2 : 1.05}
        />
        <path
          d={dense ? 'M-0.4 5.8 H10.8' : 'M-0.6 6.1 C4.1 5.2 9 7.1 11.4 6.4'}
          strokeWidth={dense ? 2.05 : 0.95}
        />
        <path
          d={dense ? 'M-0.4 10 H10.8' : 'M-0.6 10.4 C3.1 9.6 9.8 11.5 14.8 10.3'}
          strokeWidth={dense ? 2.3 : 1.12}
        />
        {!dense && <path d="M2.2 14.7 C6.4 14 10.8 15.7 14.8 14.6" strokeWidth="0.92" />}
      </g>
    </pattern>
  );
}

export function WoodcutPressFilter() {
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 64 64"
      className="pointer-events-none absolute h-16 w-16 overflow-hidden opacity-0"
    >
      <defs>
        <WoodcutHatch id="woodcut-hatch-lampblack" stroke="var(--ink-lampblack)" />
        <WoodcutHatch id="woodcut-hatch-cinnabar" stroke="var(--ink-cinnabar)" />
        <WoodcutHatch id="woodcut-hatch-prussian" stroke="var(--ink-prussian)" />
        <WoodcutHatch id="woodcut-hatch-sepia" stroke="var(--ink-sepia)" />
        <WoodcutHatch id="woodcut-hatch-lampblack-small" stroke="var(--ink-lampblack)" dense />
        <WoodcutHatch id="woodcut-hatch-cinnabar-small" stroke="var(--ink-cinnabar)" dense />
        <WoodcutHatch id="woodcut-hatch-prussian-small" stroke="var(--ink-prussian)" dense />
        <WoodcutHatch id="woodcut-hatch-sepia-small" stroke="var(--ink-sepia)" dense />
      </defs>
    </svg>
  );
}

export function PuzzleSilhouette({
  name,
  className = '',
}: {
  name?: string;
  className?: string;
}) {
  if (!name) return null;
  const Icon = WOODCUTS[name];
  if (!Icon) return null;
  const ink = WOODCUT_INK[name] ?? 'lampblack';
  return (
    <span className={`${className} ink-${ink}`.trim()} aria-hidden>
      <span className="woodcut-screen">
        <Icon />
      </span>
    </span>
  );
}
