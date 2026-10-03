import { explorerUrl } from "@/lib/config";
import { shortKey } from "@/lib/format";

export function TxLink({ signature, label = "tx" }: { signature: string; label?: string }) {
  return (
    <a
      href={explorerUrl("tx", signature)}
      target="_blank"
      rel="noreferrer"
      className="font-mono text-sm"
    >
      {label} {shortKey(signature)} ↗
    </a>
  );
}
