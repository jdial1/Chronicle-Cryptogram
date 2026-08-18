import { useId, useMemo, type ComponentType, type SVGProps } from 'react';
import type { IconType } from 'react-icons';
import {
  GiAnticlockwiseRotation,
  GiCalendar,
  GiCargoCrate,
  GiCheckMark,
  GiCheckedShield,
  GiCigar,
  GiCrossedPistols,
  GiCrossMark,
  GiCycle,
  GiDrowning,
  GiEnvelope,
  GiFairyWand,
  GiFastArrow,
  GiFishingHook,
  GiGavel,
  GiGoldBar,
  GiHandcuffs,
  GiHazardSign,
  GiHelp,
  GiHistogram,
  GiHospital,
  GiKey,
  GiKeyboard,
  GiLaurelCrown,
  GiLightBulb,
  GiLipstick,
  GiLockedChest,
  GiMagnifyingGlass,
  GiMedal,
  GiMedicalPack,
  GiNewspaper,
  GiOpenBook,
  GiPadlock,
  GiPadlockOpen,
  GiPapers,
  GiPearlNecklace,
  GiPlainArrow,
  GiPocketWatch,
  GiPoisonBottle,
  GiPoliceBadge,
  GiPrisoner,
  GiQuillInk,
  GiRadioTower,
  GiRevolver,
  GiSailboat,
  GiSandsOfTime,
  GiScrollUnfurled,
  GiSecretBook,
  GiSecretDoor,
  GiSkeletonKey,
  GiSparkles,
  GiSpy,
  GiSuitcase,
  GiSunrise,
  GiThreeFriends,
  GiTiedScroll,
  GiTigerHead,
  GiVial,
  GiWantedReward,
  GiWaxSeal,
  GiWineBottle,
} from 'react-icons/gi';

type InkProps = SVGProps<SVGSVGElement>;

function ink(Icon: IconType, extraClass = ''): ComponentType<InkProps> {
  const Svg = Icon as ComponentType<InkProps>;
  return ({ className = '', ...props }) => (
    <Svg className={`${extraClass} ${className}`.trim()} {...props} />
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
      className={`decoded-stamp absolute z-20${board ? '' : ' is-issue'}`}
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

const SILHOUETTE_SCALE: Record<string, number> = {
  GiCigar: 1.15,
  GiDrowning: 1.08,
  GiKey: 1.12,
  GiPocketWatch: 1.12,
  GiPoisonBottle: 1.18,
  GiRevolver: 1.14,
  GiSuitcase: 1.32,
  GiVial: 1.3,
  GiWineBottle: 1.16,
};

const SILHOUETTES: Record<string, ComponentType<InkProps>> = {
  GiCargoCrate: ink(GiCargoCrate),
  GiCigar: ink(GiCigar),
  GiCrossedPistols: ink(GiCrossedPistols),
  GiDrowning: ink(GiDrowning),
  GiFishingHook: ink(GiFishingHook),
  GiGavel: ink(GiGavel),
  GiGoldBar: ink(GiGoldBar),
  GiHandcuffs: ink(GiHandcuffs),
  GiHospital: ink(GiHospital),
  GiKey: ink(GiKey),
  GiLipstick: ink(GiLipstick),
  GiLockedChest: ink(GiLockedChest),
  GiMedicalPack: ink(GiMedicalPack),
  GiPearlNecklace: ink(GiPearlNecklace),
  GiPocketWatch: ink(GiPocketWatch),
  GiPoisonBottle: ink(GiPoisonBottle),
  GiPoliceBadge: ink(GiPoliceBadge),
  GiPrisoner: ink(GiPrisoner),
  GiRadioTower: ink(GiRadioTower),
  GiRevolver: ink(GiRevolver),
  GiSailboat: ink(GiSailboat),
  GiScrollUnfurled: ink(GiScrollUnfurled),
  GiSecretBook: ink(GiSecretBook),
  GiSecretDoor: ink(GiSecretDoor),
  GiSpy: ink(GiSpy),
  GiSuitcase: ink(GiSuitcase),
  GiSunrise: ink(GiSunrise),
  GiTigerHead: ink(GiTigerHead),
  GiVial: ink(GiVial),
  GiWantedReward: ink(GiWantedReward),
  GiWineBottle: ink(GiWineBottle),
};

export function PuzzleSilhouette({
  name,
  className = '',
}: {
  name?: string;
  className?: string;
}) {
  if (!name) return null;
  const Icon = SILHOUETTES[name];
  if (!Icon) return null;
  const scale = SILHOUETTE_SCALE[name] ?? 1;
  return (
    <span className={className} aria-hidden>
      <Icon style={scale === 1 ? undefined : { transform: `scale(${scale})` }} />
    </span>
  );
}
