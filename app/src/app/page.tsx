import { FundraiserList } from "@/components/FundraiserList";

export default function Home() {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4 pt-6">
        <h1 className="max-w-[760px] text-5xl font-bold leading-[1.1] tracking-tight">
          Your donation goes to the verified recipient. Or back to you. Nowhere else.
        </h1>
        <p className="max-w-[680px] text-lg text-muted">
          Medical care, humanitarian aid, disaster relief, schools, animal shelters: every fundraiser is tied to one verified recipient, never to the organizer. The money waits in a vault no person controls, is paid out
          automatically when the target is reached, and comes back to you if it is not.
        </p>
      </section>
      <FundraiserList />
    </div>
  );
}
