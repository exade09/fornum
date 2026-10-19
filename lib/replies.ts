/**
 * What the operator pastes into the WhatsApp thread
 *
 * Written here rather than typed each time, so every reply says the same thing
 * and the link is never retyped by hand
 */

export function launchReply({
  name,
  symbol,
  mint,
  link,
  feesToMasked,
}: {
  name: string;
  symbol: string;
  mint: string;
  /** sign in link for the number in the thread, when the fees are theirs */
  link: string | null;
  /** set when the fees go to somebody else's number */
  feesToMasked: string | null;
}) {
  const lines = [
    `Launched: ${name} (${symbol})`,
    `https://pump.fun/coin/${mint}`,
    "",
  ];

  if (link) {
    lines.push(
      "Your creator fees are waiting here. Open the link, link a wallet and claim whenever you like:",
      link,
      "",
      "The link signs you in once, do not share it",
    );
  } else if (feesToMasked) {
    lines.push(
      `The creator fees go to ${feesToMasked}. They can sign in on the site with that number to claim them`,
    );
  }

  return lines.join("\n");
}

export function signInReply(link: string) {
  return [
    "Here is your sign in link for Fornum:",
    link,
    "",
    "It works once, for a week. Do not share it",
  ].join("\n");
}
