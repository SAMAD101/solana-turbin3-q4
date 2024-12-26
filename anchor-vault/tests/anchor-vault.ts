import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

import { AnchorVault } from "../target/types/anchor_vault";

describe("anchor_vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AnchorVault as Program<AnchorVault>;

  let vaultPDA: PublicKey;
  let vaultBump: number;
  let statePDA: PublicKey;
  let stateBump: number;

  before(async () => {
    [statePDA, stateBump] = await PublicKey.findProgramAddress(
      [Buffer.from("state"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );
    
    [vaultPDA, vaultBump] = await PublicKey.findProgramAddress(
      [Buffer.from("vault"), statePDA.toBuffer()],
      program.programId
    );
  });

  it("initialize", async () => {
    let accountParams = {
      user: provider.wallet.publicKey,
      state: statePDA,
      vault: vaultPDA,
      systemProgram: SystemProgram.programId,
    } as any;
    const tx = await program.methods
     .initialize()
     .accounts(accountParams)
     .rpc();

    const stateAccount = await program.account.vaultState.fetch(statePDA);
    assert.equal(stateAccount.stateBump, stateBump);
    assert.equal(stateAccount.vaultBump, vaultBump);

    console.log("Initialize successful, transaction signature:", tx);
  });

  it("deposit", async () => {
    const depositAmount = new anchor.BN(1_000_000_000); // 1 SOL
    const beforeBalance = await provider.connection.getBalance(vaultPDA);

    let accountParams = {
      user: provider.wallet.publicKey,
      state: statePDA,
      vault: vaultPDA,
      systemProgram: anchor.web3.SystemProgram.programId,
    } as any;
    const tx = await program.methods
      .deposit(depositAmount)
      .accounts(accountParams)
      .rpc();
    
    const afterBalance = await provider.connection.getBalance(vaultPDA);
    assert.equal(beforeBalance + depositAmount.toNumber(), afterBalance);
    console.log("Deposit successful, transaction signature:", tx);
  });

  it("withdraw", async () => {
    const withdrawAmount = new anchor.BN(500_000_000); // 0.5 SOL
    const beforeBalance = await provider.connection.getBalance(provider.wallet.publicKey);

    let accountParams = {
      user: provider.wallet.publicKey,
      state: statePDA,
      vault: vaultPDA,
      systemProgram: anchor.web3.SystemProgram.programId,
    } as any;
    const tx = await program.methods
      .withdraw(withdrawAmount)
      .accounts(accountParams)
      .rpc();

    const afterBalance = await provider.connection.getBalance(provider.wallet.publicKey);
    assert.isAbove(afterBalance, beforeBalance);
    console.log("Withdraw successful, transaction signature:", tx);
  });
});
