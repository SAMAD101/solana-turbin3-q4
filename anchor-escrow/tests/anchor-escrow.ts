import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";

import { AnchorEscrow } from "../target/types/anchor_escrow";
import { assert } from "chai";

describe("anchor-escrow-q424", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AnchorEscrow as Program<AnchorEscrow>;

  let escrowPDA;
  let escrowBump;

  before(async () => {
    [escrowPDA, escrowBump] = await PublicKey.findProgramAddress(
      [Buffer.from("state"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

  });
  
  it("Making a new escrow", async () => {
    
  });
});
