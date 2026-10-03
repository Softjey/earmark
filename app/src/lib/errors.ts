/** Turns anything thrown by a transaction into plain English for the UI. */

export type ErrorInfo = { title: string; message: string; code?: string };

const PROGRAM_ERRORS: Record<string, { title: string; message: string }> = {
  RecipientNotVerified: {
    title: "This wallet is not a verified recipient",
    message:
      "The program rejected the transaction: money can only be earmarked for an organisation that a verifier has checked. You can't name yourself as the recipient.",
  },
  DocumentAlreadyUsed: {
    title: "This document was already used",
    message: "Each supporting document (invoice, quote, budget) can back only one fundraiser. Ask the recipient for a new one.",
  },
  InvalidTarget: { title: "Invalid target", message: "The target must be greater than zero." },
  DeadlineInPast: { title: "Deadline is in the past", message: "Choose a deadline that is still in the future." },
  NotPending: {
    title: "Not waiting for confirmation",
    message: "This fundraiser was already confirmed, paid out or cancelled.",
  },
  NotActive: {
    title: "Fundraiser is not active",
    message: "Donations are open only after the recipient confirms, and only until the target is reached or the fundraiser is cancelled.",
  },
  DeadlinePassed: { title: "Deadline passed", message: "This fundraiser no longer accepts donations." },
  NotRefundable: {
    title: "Refunds are not open",
    message: "A refund is possible only after the fundraiser is cancelled or its deadline passes without reaching the target.",
  },
  AlreadyRefunded: { title: "Already refunded", message: "You already took this donation back." },
  Unauthorized: { title: "Not allowed", message: "This wallet is not allowed to do that." },
  FieldTooLong: { title: "Text is too long", message: "Shorten the name, registry number or link and try again." },
  InvalidAmount: { title: "Invalid amount", message: "Enter an amount greater than zero." },
  NotCancellable: {
    title: "Can't be cancelled",
    message: "A fundraiser that was paid out or already cancelled can't be cancelled again.",
  },
};

// Anchor custom error codes start at 6000, in IDL order.
const CODE_ORDER = Object.keys(PROGRAM_ERRORS);
const codeByNumber = (n: number) => CODE_ORDER[n - 6000] as keyof typeof PROGRAM_ERRORS | undefined;

function logsOf(err: unknown): string[] {
  const e = err as { logs?: string[]; transactionLogs?: string[] };
  return e?.logs ?? e?.transactionLogs ?? [];
}

function programCode(err: unknown): string | undefined {
  const e = err as { error?: { errorCode?: { code?: string } }; message?: string };
  const direct = e?.error?.errorCode?.code;
  if (direct) return direct;
  const text = [e?.message ?? "", ...logsOf(err)].join("\n");
  const named = /Error Code: (\w+)/.exec(text)?.[1];
  if (named) return named;
  const hex = /custom program error: 0x([0-9a-f]+)/i.exec(text)?.[1];
  return hex ? codeByNumber(parseInt(hex, 16)) : undefined;
}

export function describeError(err: unknown): ErrorInfo {
  const code = programCode(err);
  if (code && PROGRAM_ERRORS[code]) return { ...PROGRAM_ERRORS[code], code };

  const text = `${(err as Error)?.message ?? err} ${logsOf(err).join(" ")}`;
  if (/user rejected|rejected the request|declined|cancell?ed/i.test(text))
    return { title: "Request cancelled", message: "You cancelled the request in your wallet. Nothing was sent." };
  if (/already in use/i.test(text))
    return {
      title: "Already exists",
      message: "This wallet already has a verification record. Revoked wallets can't be verified again.",
    };
  if (/no record of a prior credit|insufficient lamports|insufficient funds for fee/i.test(text))
    return { title: "Not enough SOL", message: "Your wallet needs a little devnet SOL to pay the network fee." };
  if (/owner does not match|AccountNotInitialized|could not find account|TokenAccountNotFound/i.test(text))
    return { title: "No ePLN in this wallet", message: "Your wallet has no ePLN token account yet. Get some test ePLN first." };
  if (/insufficient funds/i.test(text))
    return { title: "Not enough ePLN", message: "Your wallet holds less ePLN than the amount you entered." };
  if (/blockhash not found|expired/i.test(text))
    return { title: "Transaction expired", message: "The network took too long. Please try again." };
  if (/too many requests|rate limit|failed to fetch|network|429|timeout/i.test(text))
    return { title: "Network problem", message: "Could not reach the Solana network. Check your connection and try again." };
  return { title: "Something went wrong", message: (err as Error)?.message || "Unknown error. Please try again." };
}
