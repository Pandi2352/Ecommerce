import type { IconColor } from './types';

/** Per-item icon hue. Icons render duotone: solid stroke + translucent fill of this color. */
export const ICON_COLORS: Record<IconColor, string> = {
  indigo: 'text-indigo-500',
  violet: 'text-violet-500',
  rose: 'text-rose-500',
  amber: 'text-amber-500',
  emerald: 'text-emerald-500',
  sky: 'text-sky-500',
  cyan: 'text-cyan-500',
  fuchsia: 'text-fuchsia-500',
  orange: 'text-orange-500',
  yellow: 'text-yellow-500',
  teal: 'text-teal-500',
  blue: 'text-blue-500',
  green: 'text-green-500',
  purple: 'text-purple-500',
  slate: 'text-slate-400',
  red: 'text-red-500',
  lime: 'text-lime-500',
};
