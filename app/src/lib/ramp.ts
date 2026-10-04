// Fiat on-ramp: Ramp Network's hosted widget sells crypto for a card payment straight to the user's own wallet.
// It never touches a fundraiser vault, so it is outside the trust model, like any exchange a donor might use.
// Defaults to Ramp's demo environment (test cards, Solana devnet); production swaps the URL, asset and API key.
const RAMP_URL = process.env.NEXT_PUBLIC_RAMP_URL || "https://app.demo.rampnetwork.com";
/** Devnet SOL pays network fees. In production this would be the PLN/EUR stablecoin the vaults hold. */
const RAMP_ASSET = process.env.NEXT_PUBLIC_RAMP_ASSET || "SOLANA_SOL";
/** Ramp refuses to open without a host API key (free from Ramp's partner dashboard), so the button hides until one is set. */
const RAMP_API_KEY = process.env.NEXT_PUBLIC_RAMP_API_KEY;

export const rampEnabled = !!RAMP_API_KEY;

export function rampUrl(wallet: string, pln = 20): string {
  const params = new URLSearchParams({
    hostApiKey: RAMP_API_KEY ?? "",
    hostAppName: "Earmark",
    hostLogoUrl: `${window.location.origin}/icon.svg`,
    enabledFlows: "ONRAMP",
    enabledCryptoAssets: RAMP_ASSET,
    outAsset: RAMP_ASSET,
    inAsset: "PLN",
    inAssetValue: String(pln * 100), // minor units (grosze)
    userAddress: wallet,
  });
  return `${RAMP_URL}/?${params}`;
}
