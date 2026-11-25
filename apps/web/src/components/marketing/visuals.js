import {
  Briefcase, Cake, Camera, ChefHat, ClipboardCheck, ConciergeBell, CookingPot, Flame, Flower2, Gem, HeartHandshake,
  Home, PartyPopper, Soup, Sparkles, Users, UtensilsCrossed, Video, Wine,
} from 'lucide-react';

/** Icon and tint per service category (codes from /catalog). Purely presentational. */
export const CATEGORY_LOOK = {
  HOME_CHEF: { icon: CookingPot, bg: '#FFF4E5', fg: '#B45309' },
  PRO_CHEF: { icon: ChefHat, bg: '#E3F2FD', fg: '#1551A5' },
  PERSONAL_CHEF: { icon: Soup, bg: '#FDECEC', fg: '#B91C1C' },
  CATERER: { icon: UtensilsCrossed, bg: '#E8F5E9', fg: '#15803D' },
  EVENT_PLANNER: { icon: ClipboardCheck, bg: '#EDE7F6', fg: '#5B21B6' },
  WEDDING_PLANNER: { icon: HeartHandshake, bg: '#FCE4EC', fg: '#BE185D' },
  EVENT_MANAGER: { icon: Briefcase, bg: '#E0F2F1', fg: '#0F766E' },
  DECORATOR: { icon: Flower2, bg: '#FFF8E1', fg: '#A16207' },
  PHOTOGRAPHER: { icon: Camera, bg: '#E3F2FD', fg: '#1551A5' },
  VIDEOGRAPHER: { icon: Video, bg: '#EDE7F6', fg: '#5B21B6' },
  BARTENDER: { icon: Wine, bg: '#FDECEC', fg: '#9F1239' },
  WAITER: { icon: ConciergeBell, bg: '#E8F5E9', fg: '#15803D' },
  KITCHEN_ASSISTANT: { icon: Flame, bg: '#FFF4E5', fg: '#C2410C' },
};
export const DEFAULT_LOOK = { icon: Sparkles, bg: '#E3F2FD', fg: '#1551A5' };
export const lookFor = (code) => CATEGORY_LOOK[code] || DEFAULT_LOOK;

/** Icon and tint per event type (codes from /catalog eventTypes). */
export const OCCASION_LOOK = {
  WEDDING: { icon: Gem, bg: 'linear-gradient(135deg,#FCE4EC,#F8BBD0)', fg: '#9D174D' },
  ENGAGEMENT: { icon: HeartHandshake, bg: 'linear-gradient(135deg,#EDE7F6,#D1C4E9)', fg: '#5B21B6' },
  BIRTHDAY: { icon: Cake, bg: 'linear-gradient(135deg,#FFF4E5,#FFE0B2)', fg: '#B45309' },
  HOUSEWARMING: { icon: Home, bg: 'linear-gradient(135deg,#E8F5E9,#C8E6C9)', fg: '#166534' },
  FAMILY_GATHERING: { icon: Users, bg: 'linear-gradient(135deg,#E3F2FD,#BBDEFB)', fg: '#1551A5' },
  DINNER_PARTY: { icon: Wine, bg: 'linear-gradient(135deg,#FDECEC,#FFCDD2)', fg: '#9F1239' },
  CORPORATE: { icon: Briefcase, bg: 'linear-gradient(135deg,#E0F2F1,#B2DFDB)', fg: '#0F766E' },
  FESTIVAL: { icon: PartyPopper, bg: 'linear-gradient(135deg,#FFF8E1,#FFECB3)', fg: '#A16207' },
  OTHER: { icon: Sparkles, bg: 'linear-gradient(135deg,#F1F5F9,#E2E8F0)', fg: '#334155' },
};
export const occasionLook = (code) => OCCASION_LOOK[code] || OCCASION_LOOK.OTHER;
