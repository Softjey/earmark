/** Demo-only samples for the "Fill demo data" button on /new. Not used anywhere else. */
export type DemoFundraiser = { title: string; story: string; target: number };

export const DEMO_FUNDRAISERS: DemoFundraiser[] = [
  { title: "Cochlear implant for Zosia", story: "Zosia is 4 and has been deaf since birth. A cochlear implant and a year of rehabilitation would let her hear her family for the first time. The clinic's quote covers the device, surgery and follow-up.", target: 4800 },
  { title: "Knee surgery for a young footballer", story: "Marek, 17, tore his ligaments during a youth match. The public queue for surgery is over a year long. The clinic's quote covers the operation and physiotherapy so he can walk without pain again.", target: 3200 },
  { title: "Physiotherapy after a stroke", story: "Our father, Jan, had a stroke in spring. Intensive rehabilitation in the first months decides how much movement returns. The budget covers a 6-week stationary programme.", target: 2600 },
  { title: "Hearing aids for Grandma Halina", story: "Halina, 82, has stopped joining family dinners because she cannot follow the conversation. Two digital hearing aids would give her back her place at the table.", target: 1500 },
  { title: "Heart surgery for baby Staś", story: "Staś was born with a congenital heart defect. The surgery is planned for the next few weeks at a specialised centre. The invoice covers the procedure and a week in intensive care.", target: 5000 },
  { title: "Prosthetic leg for Kasia", story: "Kasia lost her leg in a traffic accident two years ago. A modern prosthesis with a flexible foot would let her return to work and walk her daughter to school.", target: 4200 },
  { title: "Eye operation for Tomek", story: "Tomek, 9, has a rapidly progressing cataract in both eyes. Surgery within the next two months can save his vision. The quote covers both operations.", target: 2100 },
  { title: "Dental reconstruction after an accident", story: "After a bike accident, Ola needs a series of dental implants and surgery. Her insurance covers only a small part. The clinic's plan is attached.", target: 2800 },
  { title: "Insulin pump for Wojtek", story: "Wojtek, 11, has type 1 diabetes and his glucose swings dangerously at night. An insulin pump with a sensor would make nights safe for him and his parents.", target: 1900 },
  { title: "Spine rehabilitation camp", story: "After a spinal injury, Paweł needs a month-long rehabilitation programme at a specialised centre. The budget includes therapy, accommodation and daily care.", target: 3600 },
  { title: "Wheelchair for Ania", story: "Ania, 14, has muscular dystrophy and has outgrown her old wheelchair. A custom-fitted electric chair would give her independence at school.", target: 2400 },
  { title: "Oncology treatment abroad for Mikołaj", story: "A rare form of childhood cancer requires a therapy that is not available in Poland. The invoice from the treatment centre covers the first two cycles.", target: 5000 },
  { title: "Speech therapy for twin brothers", story: "Both brothers have a severe speech delay. A year of weekly sessions with a specialist can help them start school on equal terms. The plan and price list are attached.", target: 1200 },
  { title: "Hip replacement for Mr. Stefan", story: "Stefan, 68, has lived with severe hip pain for years and can barely leave his flat. The clinic offers a replacement with a short waiting time. The quote is attached.", target: 3000 },
  { title: "Dialysis transport and equipment", story: "Danuta needs dialysis three times a week and has no way to travel. The budget covers a home dialysis set-up and first supplies.", target: 2200 },
  { title: "Epilepsy diagnostics for little Lena", story: "Lena has seizures that doctors cannot explain. A 5-day video-EEG monitoring at a specialised hospital would finally give a diagnosis and the right treatment.", target: 1700 },
  { title: "Burn rehabilitation for Bartek", story: "Bartek suffered severe burns on his hands. Scar therapy and specialised physiotherapy in the next six months decide whether he can use his hands fully again.", target: 2900 },
  { title: "Mental health therapy for teenagers", story: "A school counsellor identified several students who need long-term therapy but cannot afford it. The budget covers 6 months of weekly sessions for one group.", target: 1400 },
  { title: "Back surgery for Mrs. Krystyna", story: "Krystyna, 59, has a herniated disc that is pressing on a nerve. She can no longer stand for more than a few minutes. The surgery is scheduled once the clinic receives payment.", target: 3400 },
  { title: "Premature baby care for Hania", story: "Hania was born at 27 weeks and needs specialised equipment and monitoring at home. The invoice covers a monitor, oxygen supply and a follow-up programme.", target: 4100 },
];

export const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

/** A tiny fake "invoice" so the required document field is satisfied. Only its SHA-256 is used. */
export function demoDocument(title: string): File {
  const text = `DEMO INVOICE\n${title}\nGenerated ${new Date().toISOString()}\nRef ${crypto.randomUUID()}\n`;
  return new File([text], "demo-invoice.pdf", { type: "application/pdf" });
}
