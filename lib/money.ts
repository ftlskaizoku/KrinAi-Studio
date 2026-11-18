// Frais Whop supposés (3 % + 2,7 % + 0,30 $, à confirmer avec votre compte Whop) et part de KrinAi par défaut.
export const FEE_PCT = 5.7;
export const FEE_FIXED = 0.3;
export const DEFAULT_KRINAI_PCT = 30;
export const FCFA_PER_USD = 600; // ordre de grandeur utilisé dans la maquette

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const estFees = (gross: number) => round2((gross * FEE_PCT) / 100 + FEE_FIXED);
export const netOf = (gross: number, fees?: number) => Math.max(0, round2(gross - (fees ?? estFees(gross))));
export const krinaiShare = (net: number, pct = DEFAULT_KRINAI_PCT) => round2((net * pct) / 100);
