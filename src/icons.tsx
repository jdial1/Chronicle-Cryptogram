import type { ComponentType, SVGProps } from 'react';
import type { IconType } from 'react-icons';
import {
  GiAnticlockwiseRotation,
  GiCheckMark,
  GiCalendar,
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
  const frame = board ? 'w-[14rem] h-[14rem]' : 'w-[5.75rem] h-[5.75rem]';
  const ring = board ? 'border-[10px]' : 'border-[5px]';
  const mark = board ? 'w-24 h-24' : 'w-10 h-10';
  const smear = board
    ? 'translate-x-[5px] translate-y-[3px] blur-[1.5px]'
    : 'translate-x-0.5 translate-y-px blur-[1px]';

  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      <span className={`relative ${frame} -rotate-12`}>
        <span
          className={`absolute inset-0 flex items-center justify-center rounded-full ${ring} border-red-700/28 mix-blend-multiply ${smear}`}
        >
          <CheckCircle2 className={`${mark} text-red-700/28`} />
        </span>
        <span
          className={`flex items-center justify-center w-full h-full rounded-full ${ring} border-red-700/55 mix-blend-multiply`}
        >
          <CheckCircle2 className={`${mark} text-red-700/55`} />
        </span>
      </span>
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
