import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { expect } from "chai";
import { Earmark } from "../target/types/earmark";

describe("earmark", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.earmark as Program<Earmark>;

  it("is deployed and callable", async () => {
    const sig = await program.methods.ping().rpc();
    expect(sig).to.be.a("string");
  });
});
