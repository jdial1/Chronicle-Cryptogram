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
export const ChevronDown = ink(GiPlainArrow, 'rotate-90');
export const ChevronUp = ink(GiPlainArrow, '-rotate-90');
