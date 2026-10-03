import * as anchor from "@anchor-lang/core";
import { BN, Program } from "@anchor-lang/core";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  createMint,
  getAccount,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotent,
  mintTo,
} from "@solana/spl-token";
import { expect } from "chai";
import { createHash } from "crypto";
import { Earmark } from "../target/types/earmark";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("earmark", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.earmark as Program<Earmark>;
  const conn = provider.connection;
  const payer = (provider.wallet as anchor.Wallet).payer;

  const verifier = Keypair.generate();
  const payee = Keypair.generate();
  const organizer = Keypair.generate();
  const donor1 = Keypair.generate();
  const donor2 = Keypair.generate();
  const stranger = Keypair.generate();
  const fraudster = Keypair.generate(); // never verified

  let mint: PublicKey;
  const ata: Record<string, PublicKey> = {};
  let nextId = 1;
  let nextDocument = 1;

  const pda = (seeds: (Buffer | Uint8Array)[]) =>
    PublicKey.findProgramAddressSync(seeds, program.programId)[0];
  const configPda = pda([Buffer.from("config")]);
  const recipientPda = (w: PublicKey) =>
    pda([Buffer.from("recipient"), w.toBuffer()]);
  const fundraiserPda = (org: PublicKey, id: number) =>
    pda([
      Buffer.from("fundraiser"),
      org.toBuffer(),
      new BN(id).toArrayLike(Buffer, "le", 8),
    ]);
  const vaultPda = (f: PublicKey) => pda([Buffer.from("vault"), f.toBuffer()]);
  const documentHash = () =>
    Array.from(createHash("sha256").update(`document-${nextDocument++}`).digest());
  const bal = async (k: PublicKey) => Number((await getAccount(conn, k)).amount);
  const now = async () => {
    const slot = await conn.getSlot();
    return (await conn.getBlockTime(slot)) as number;
  };

  async function expectErr(p: Promise<unknown>, code: string) {
    try {
      await p;
    } catch (e: any) {
      const text = `${e?.error?.errorCode?.code ?? ""} ${e?.message ?? ""} ${(e?.logs ?? []).join("\n")}`;
      expect(text, `expected ${code}, got: ${text}`).to.include(code);
      return;
    }
    expect.fail(`expected ${code}, but the call succeeded`);
  }

  /** Creates a fundraiser; returns its address. */
  async function create(opts: {
    target?: number;
    deadlineIn?: number;
    recipient?: Keypair;
    hash?: number[];
    org?: Keypair;
  } = {}) {
    const org = opts.org ?? organizer;
    const id = nextId++;
    const recipient = opts.recipient ?? payee;
    await program.methods
      .createFundraiser(
        new BN(id),
        new BN(opts.target ?? 1000),
        new BN((await now()) + (opts.deadlineIn ?? 3600)),
        opts.hash ?? documentHash(),
        "/api/metadata/" + id
      )
      .accounts({
        organizer: org.publicKey,
        recipientWallet: recipient.publicKey,
        mint,
      })
      .signers([org])
      .rpc();
    return fundraiserPda(org.publicKey, id);
  }

  async function createActive(opts: Parameters<typeof create>[0] = {}) {
    const f = await create(opts);
    await program.methods
      .confirmFundraiser()
      .accounts({ recipientWallet: payee.publicKey, fundraiser: f })
      .signers([payee])
      .rpc();
    return f;
  }

  const donate = (f: PublicKey, donor: Keypair, amount: number) =>
    program.methods
      .donate(new BN(amount))
      .accounts({
        donor: donor.publicKey,
        fundraiser: f,
        donorToken: ata[donor.publicKey.toBase58()],
        recipientWallet: payee.publicKey,
        mint,
      })
      .signers([donor])
      .rpc();

  const refund = (f: PublicKey, donor: Keypair) =>
    program.methods
      .refund()
      .accounts({
        caller: donor.publicKey,
        donor: donor.publicKey,
        fundraiser: f,
        donorToken: ata[donor.publicKey.toBase58()],
      })
      .signers([donor])
      .rpc();

  /** Anyone can trigger the refund; the tokens still go to the donor. */
  const refundFor = (f: PublicKey, donor: Keypair, caller: Keypair) =>
    program.methods
      .refund()
      .accounts({
        caller: caller.publicKey,
        donor: donor.publicKey,
        fundraiser: f,
        donorToken: ata[donor.publicKey.toBase58()],
      })
      .signers([caller])
      .rpc();

  const cancel = (f: PublicKey, signer: Keypair) =>
    program.methods
      .cancel()
      .accounts({ signer: signer.publicKey, fundraiser: f })
      .signers([signer])
      .rpc();

  before(async () => {
    const wallets = [verifier, payee, organizer, donor1, donor2, stranger, fraudster];
    const tx = new Transaction();
    for (const w of wallets)
      tx.add(
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: w.publicKey,
          lamports: 5 * LAMPORTS_PER_SOL,
        })
      );
    await provider.sendAndConfirm(tx);

    mint = await createMint(conn, payer, payer.publicKey, null, 6);
    for (const d of [donor1, donor2, stranger]) {
      const a = await createAssociatedTokenAccountIdempotent(
        conn,
        payer,
        mint,
        d.publicKey
      );
      ata[d.publicKey.toBase58()] = a;
      await mintTo(conn, payer, mint, a, payer, 10_000);
    }
    ata[payee.publicKey.toBase58()] = getAssociatedTokenAddressSync(
      mint,
      payee.publicKey
    );
  });

  describe("init_config", () => {
    it("initialises once and only once", async () => {
      await program.methods
        .initConfig(verifier.publicKey)
        .accounts({ deployer: payer.publicKey, mint })
        .rpc();
      const cfg = await program.account.config.fetch(configPda);
      expect(cfg.verifier.toBase58()).to.eq(verifier.publicKey.toBase58());
      expect(cfg.mint.toBase58()).to.eq(mint.toBase58());

      await expectErr(
        program.methods
          .initConfig(stranger.publicKey)
          .accounts({ deployer: payer.publicKey, mint })
          .rpc(),
        "already in use"
      );
    });
  });

  describe("verify_recipient / revoke_recipient", () => {
    it("verifier verifies the payee", async () => {
      await program.methods
        .verifyRecipient("Relief Foundation", "REG-123")
        .accounts({ verifier: verifier.publicKey, wallet: payee.publicKey })
        .signers([verifier])
        .rpc();
      const r = await program.account.recipient.fetch(recipientPda(payee.publicKey));
      expect(r.active).to.eq(true);
      expect(r.name).to.eq("Relief Foundation");
    });

    it("non-verifier is rejected (Unauthorized)", async () => {
      await expectErr(
        program.methods
          .verifyRecipient("Fake", "X")
          .accounts({ verifier: stranger.publicKey, wallet: fraudster.publicKey })
          .signers([stranger])
          .rpc(),
        "Unauthorized"
      );
    });

    it("rejects over-long name / registry id", async () => {
      await expectErr(
        program.methods
          .verifyRecipient("x".repeat(65), "X")
          .accounts({ verifier: verifier.publicKey, wallet: fraudster.publicKey })
          .signers([verifier])
          .rpc(),
        "FieldTooLong"
      );
      await expectErr(
        program.methods
          .verifyRecipient("ok", "x".repeat(33))
          .accounts({ verifier: verifier.publicKey, wallet: fraudster.publicKey })
          .signers([verifier])
          .rpc(),
        "FieldTooLong"
      );
    });

    it("revoked recipient gets no new fundraisers or donations", async () => {
      const other = Keypair.generate();
      await conn.confirmTransaction(
        await conn.requestAirdrop(other.publicKey, LAMPORTS_PER_SOL)
      );
      await program.methods
        .verifyRecipient("Other Charity", "REG-999")
        .accounts({ verifier: verifier.publicKey, wallet: other.publicKey })
        .signers([verifier])
        .rpc();

      // Fundraiser for `other`, activated, then revoke.
      const id = nextId++;
      await program.methods
        .createFundraiser(
          new BN(id),
          new BN(500),
          new BN((await now()) + 3600),
          documentHash(),
          "uri"
        )
        .accounts({
          organizer: organizer.publicKey,
          recipientWallet: other.publicKey,
          mint,
        })
        .signers([organizer])
        .rpc();
      const f = fundraiserPda(organizer.publicKey, id);
      await program.methods
        .confirmFundraiser()
        .accounts({ recipientWallet: other.publicKey, fundraiser: f })
        .signers([other])
        .rpc();

      await expectErr(
        program.methods
          .revokeRecipient()
          .accounts({ verifier: stranger.publicKey, recipient: recipientPda(other.publicKey) })
          .signers([stranger])
          .rpc(),
        "Unauthorized"
      );
      await program.methods
        .revokeRecipient()
        .accounts({ verifier: verifier.publicKey, recipient: recipientPda(other.publicKey) })
        .signers([verifier])
        .rpc();

      await expectErr(
        program.methods
          .createFundraiser(
            new BN(nextId++),
            new BN(500),
            new BN((await now()) + 3600),
            documentHash(),
            "uri"
          )
          .accounts({
            organizer: organizer.publicKey,
            recipientWallet: other.publicKey,
            mint,
          })
          .signers([organizer])
          .rpc(),
        "RecipientNotVerified"
      );
      await expectErr(
        program.methods
          .donate(new BN(10))
          .accounts({
            donor: donor1.publicKey,
            fundraiser: f,
            donorToken: ata[donor1.publicKey.toBase58()],
            recipientWallet: other.publicKey,
            mint,
          })
          .signers([donor1])
          .rpc(),
        "RecipientNotVerified"
      );
    });
  });

  describe("create_fundraiser / confirm_fundraiser", () => {
    it("fraud: unverified recipient is rejected with RecipientNotVerified", async () => {
      await expectErr(create({ recipient: fraudster }), "RecipientNotVerified");
      // the organizer's own wallet as recipient
      await expectErr(create({ recipient: organizer }), "RecipientNotVerified");
    });

    it("rejects zero target and past deadline", async () => {
      await expectErr(create({ target: 0 }), "InvalidTarget");
      await expectErr(create({ deadlineIn: -10 }), "DeadlineInPast");
    });

    it("rejects a duplicate document hash (DocumentAlreadyUsed)", async () => {
      const hash = documentHash();
      await create({ hash });
      await expectErr(create({ hash }), "DocumentAlreadyUsed");
    });

    it("creates a pending fundraiser with a vault owned by the fundraiser PDA", async () => {
      const f = await create();
      const fr = await program.account.fundraiser.fetch(f);
      expect(fr.status).to.have.property("pendingConfirmation");
      expect(fr.raised.toNumber()).to.eq(0);
      const vault = await getAccount(conn, vaultPda(f));
      expect(vault.owner.toBase58()).to.eq(f.toBase58());
      expect(vault.mint.toBase58()).to.eq(mint.toBase58());
    });

    it("only the recipient confirms, and only once", async () => {
      const f = await create();
      await expectErr(
        program.methods
          .confirmFundraiser()
          .accounts({ recipientWallet: organizer.publicKey, fundraiser: f })
          .signers([organizer])
          .rpc(),
        "Unauthorized"
      );
      await program.methods
        .confirmFundraiser()
        .accounts({ recipientWallet: payee.publicKey, fundraiser: f })
        .signers([payee])
        .rpc();
      const fr = await program.account.fundraiser.fetch(f);
      expect(fr.status).to.have.property("active");
      await expectErr(
        program.methods
          .confirmFundraiser()
          .accounts({ recipientWallet: payee.publicKey, fundraiser: f })
          .signers([payee])
          .rpc(),
        "NotPending"
      );
    });
  });

  describe("donate", () => {
    it("happy path: two donations, automatic payout in the same tx", async () => {
      const f = await createActive({ target: 1000 });
      const payeeAta = ata[payee.publicKey.toBase58()];
      const before = await conn.getAccountInfo(payeeAta).then((a) => (a ? bal(payeeAta) : 0));

      await donate(f, donor1, 600);
      expect(await bal(vaultPda(f))).to.eq(600);
      let fr = await program.account.fundraiser.fetch(f);
      expect(fr.status).to.have.property("active");

      await donate(f, donor2, 400);
      fr = await program.account.fundraiser.fetch(f);
      expect(fr.status).to.have.property("released");
      expect(fr.raised.toNumber()).to.eq(1000);
      expect(await bal(vaultPda(f))).to.eq(0);
      expect((await bal(payeeAta)) - before).to.eq(1000);
    });

    it("caps over-donation instead of rejecting it", async () => {
      const f = await createActive({ target: 500 });
      const d1Before = await bal(ata[donor1.publicKey.toBase58()]);
      await donate(f, donor1, 5000);
      expect(d1Before - (await bal(ata[donor1.publicKey.toBase58()]))).to.eq(500);
      const fr = await program.account.fundraiser.fetch(f);
      expect(fr.status).to.have.property("released");
    });

    it("rejects donations to a pending fundraiser (NotActive)", async () => {
      const f = await create();
      await expectErr(donate(f, donor1, 10), "NotActive");
    });

    it("rejects donations after the deadline (DeadlinePassed)", async () => {
      const f = await createActive({ deadlineIn: 3 });
      await sleep(6000);
      await expectErr(donate(f, donor1, 10), "DeadlinePassed");
    });

    it("rejects donations to a released fundraiser (NotActive)", async () => {
      const f = await createActive({ target: 100 });
      await donate(f, donor1, 100);
      await expectErr(donate(f, donor2, 10), "NotActive");
    });
  });

  describe("cancel / refund", () => {
    it("stranger cannot cancel (Unauthorized)", async () => {
      const f = await createActive();
      await expectErr(cancel(f, stranger), "Unauthorized");
    });

    it("organizer cancels a pending fundraiser; recipient cancels an active one", async () => {
      const p = await create();
      await cancel(p, organizer);
      expect((await program.account.fundraiser.fetch(p)).status).to.have.property("cancelled");

      const a = await createActive();
      await cancel(a, payee);
      expect((await program.account.fundraiser.fetch(a)).status).to.have.property("cancelled");
      await expectErr(cancel(a, payee), "NotCancellable");
    });

    it("donor refunds after cancel; double refund rejected", async () => {
      const f = await createActive();
      const d2 = ata[donor2.publicKey.toBase58()];
      const before = await bal(d2);
      await donate(f, donor2, 250);
      await expectErr(refund(f, donor2), "NotRefundable"); // still active, before deadline
      await cancel(f, organizer);
      await refund(f, donor2);
      expect(await bal(d2)).to.eq(before);
      expect(await bal(vaultPda(f))).to.eq(0);
      await expectErr(refund(f, donor2), "AlreadyRefunded");
    });

    it("donor refunds alone after a missed deadline", async () => {
      const f = await createActive({ target: 1000, deadlineIn: 4 });
      const d1 = ata[donor1.publicKey.toBase58()];
      const before = await bal(d1);
      await donate(f, donor1, 300);
      await expectErr(refund(f, donor1), "NotRefundable");
      await sleep(7000);
      await refund(f, donor1);
      expect(await bal(d1)).to.eq(before);
    });

    it("refund on a released fundraiser is rejected (NotRefundable)", async () => {
      const f = await createActive({ target: 100 });
      await donate(f, donor1, 100);
      await expectErr(refund(f, donor1), "NotRefundable");
    });

    it("cannot refund someone else's donation", async () => {
      const f = await createActive();
      await donate(f, donor1, 100);
      await cancel(f, organizer);
      // stranger never donated → no donation account
      await expectErr(refund(f, stranger), "AccountNotInitialized");
    });

    it("refund tokens can only go to the donor's own token account", async () => {
      const f = await createActive();
      await donate(f, donor1, 100);
      await cancel(f, organizer);
      await expectErr(
        program.methods
          .refund()
          .accounts({
            caller: donor1.publicKey,
            donor: donor1.publicKey,
            fundraiser: f,
            donorToken: ata[stranger.publicKey.toBase58()],
          })
          .signers([donor1])
          .rpc(),
        "ConstraintTokenOwner"
      );
    });

    it("anyone can trigger a refund, but the tokens only reach the donor", async () => {
      const f = await createActive();
      const d1 = ata[donor1.publicKey.toBase58()];
      const before = await bal(d1);
      const strangerBefore = await bal(ata[stranger.publicKey.toBase58()]);
      await donate(f, donor1, 100);
      await cancel(f, organizer);
      // A stranger pays the fee and cannot redirect the money to themselves.
      await expectErr(
        program.methods
          .refund()
          .accounts({
            caller: stranger.publicKey,
            donor: donor1.publicKey,
            fundraiser: f,
            donorToken: ata[stranger.publicKey.toBase58()],
          })
          .signers([stranger])
          .rpc(),
        "ConstraintTokenOwner"
      );
      await refundFor(f, donor1, stranger);
      expect(await bal(d1)).to.eq(before);
      expect(await bal(ata[stranger.publicKey.toBase58()])).to.eq(strangerBefore);
      await expectErr(refundFor(f, donor1, stranger), "AlreadyRefunded");
    });
  });
});
