import { FundraiserPage } from "@/components/FundraiserPage";

export default async function Page({ params }: { params: Promise<{ pubkey: string }> }) {
  const { pubkey } = await params;
  return <FundraiserPage pubkey={pubkey} />;
}
