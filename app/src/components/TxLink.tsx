import { explorerUrl } from "@/lib/config";

export function TxLink({ signature, label = "View transaction" }: { signature: string; label?: string }) {
  return (
    <a
      href={explorerUrl("tx", signature)}
      target="_blank"
      rel="noreferrer"
      className="text-sm" title={signature}
    >
      {label} ↗
    </a>
  );
}
