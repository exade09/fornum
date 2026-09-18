import raw from "@/content/site-config.json";

export type Overrides = {
  callsInQueue: number | null;
  callsLive: number | null;
  tokensLaunched: number | null;
  feesClaimedUsd: number | null;
  paidOutUsd: number | null;
  answerRatePct: number | null;
};

export type SiteConfig = {
  overrides: Overrides;
  banner: { enabled: boolean; text: string };
};

const EMPTY: Overrides = {
  callsInQueue: null,
  callsLive: null,
  tokensLaunched: null,
  feesClaimedUsd: null,
  paidOutUsd: null,
  answerRatePct: null,
};

/**
 * Two ways to change the numbers shown on the site:
 *
 * 1. edit content/site-config.json and push, the deploy picks it up
 * 2. set FORNUM_OVERRIDES on the host to a JSON object, it wins over the file
 *
 * Either way, a key left as null falls back to the number computed from real
 * activity, so the site never shows a made up figure by accident
 */
function readEnvOverrides(): Partial<Overrides> {
  const blob = process.env.FORNUM_OVERRIDES;
  if (!blob) return {};
  try {
    const parsed = JSON.parse(blob) as Partial<Overrides>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    // a broken env value must never take the site down
    return {};
  }
}

const fileConfig = raw as unknown as Partial<SiteConfig>;

export const siteConfig: SiteConfig = {
  overrides: { ...EMPTY, ...fileConfig.overrides, ...readEnvOverrides() },
  banner: {
    enabled: fileConfig.banner?.enabled ?? false,
    text: fileConfig.banner?.text ?? "",
  },
};

/** Returns the override when one is set, otherwise the computed value */
export function pick(key: keyof Overrides, computed: number): number {
  const value = siteConfig.overrides[key];
  return typeof value === "number" && Number.isFinite(value) ? value : computed;
}
