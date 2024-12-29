import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL,
  Signer
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  getAssociatedTokenAddress,
  createMintToInstruction
} from "@solana/spl-token";
import { assert } from "chai";

import { AnchorEscrow } from "../target/types/anchor_escrow";

describe("anchor-escrow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AnchorEscrow as Program<AnchorEscrow>;

  let maker: Signer = Keypair.generate();
  let taker: Signer = Keypair.generate();
  let seed = new anchor.BN(1);
  let escrowPDA: PublicKey;
  let vault: PublicKey;
  let mintA = new Keypair();
  let mintB = new Keypair();
  let makerAtaA: PublicKey;
  let makerAtaB: PublicKey;
  let takerAtaA: PublicKey;
  let takerAtaB: PublicKey;

  // Helper functions
  const createMint = async (provider: anchor.AnchorProvider, mint: Keypair) => {
    const lamports = await provider.connection.getMinimumBalanceForRentExemption(82);
    const tx = new anchor.web3.Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: provider.wallet.publicKey,
        newAccountPubkey: mint.publicKey,
        space: 82,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        mint.publicKey,
        6,
        maker.publicKey,
        maker.publicKey
      )
    );
    await provider.sendAndConfirm(tx, [mint]);
  };

  const createAssociatedToken = async (
    provider: anchor.AnchorProvider,
    mint: PublicKey,
    owner: PublicKey
  ) => {
    const ata = await getAssociatedTokenAddress(mint, owner);
    const tx = new anchor.web3.Transaction().add(
      createAssociatedTokenAccountInstruction(
        provider.wallet.publicKey,
        ata,
        owner,
        mint
      )
    );
    await provider.sendAndConfirm(tx, []);
    return ata;
  };

  const getTokenBalance = async (
    provider: anchor.AnchorProvider,
    ata: PublicKey
  ): Promise<number> => {
    try {
      const response = await provider.connection.getTokenAccountBalance(ata);
      return Number(response.value.amount);
    } catch (error) {
      console.error("Error getting token balance:", error);
      console.log("ATA address:", ata.toBase58());
      throw error;
    }
  };

  before(async () => {
    const signature = await provider.connection.requestAirdrop(
      maker.publicKey,
      5 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    [escrowPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("escrow"), maker.publicKey.toBuffer(), seed.toBuffer('le', 8)],
      program.programId
    );

    await createMint(provider, mintA);
    await createMint(provider, mintB);
    makerAtaA = await createAssociatedToken(provider, mintA.publicKey, maker.publicKey);
    vault = await getAssociatedTokenAddress(mintA.publicKey, escrowPDA, true);

    const mintToIx = createMintToInstruction(
      mintA.publicKey,
      makerAtaA,
      maker.publicKey,
      1_000_000_000
    );

    const mintTx = new anchor.web3.Transaction().add(mintToIx);
    await provider.sendAndConfirm(mintTx, [maker]);
  });

  it("Making a new escrow", async () => {
    const deposit = new anchor.BN(1_000_000_000);
    const receive = new anchor.BN(1_000_000_000);

    try {
      let accountParams = {
        maker: maker.publicKey,
        mintA: mintA.publicKey,
        mintB: mintB.publicKey,
        makerAtaA: makerAtaA,
        escrow: escrowPDA,
        vault: vault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      } as any;

      const tx = await program.methods
        .make(seed, deposit, receive)
        .accounts(accountParams)
        .signers([maker])
        .rpc();

      console.log("Escrow Make successful, transaction signature:", tx);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }

    const escrowAccount = await program.account.escrow.fetch(escrowPDA);
    assert.equal(escrowAccount.seed.toString(), seed.toString());
    assert.equal(escrowAccount.maker.toString(), maker.publicKey.toString());
    assert.equal(escrowAccount.mintA.toString(), mintA.publicKey.toString());
    assert.equal(escrowAccount.mintB.toString(), mintB.publicKey.toString());
    assert.equal(escrowAccount.recieve.toString(), receive.toString());

    const vaultBalance = await getTokenBalance(provider, vault);
    assert.equal(vaultBalance, deposit.toNumber());
  });

  it("Refunding escrow", async () => {
    const makerBalanceBefore = await getTokenBalance(provider, makerAtaA);

    try {
      let accountParams = {
        maker: maker.publicKey,
        mintA: mintA.publicKey,
        makerAtaA: makerAtaA,
        escrow: escrowPDA,
        vault: vault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      } as any;

      const tx = await program.methods
        .refund()
        .accounts(accountParams)
        .signers([maker])
        .rpc();

      console.log("Escrow Refund successful, transaction signature:", tx);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }

    const makerBalanceAfter = await getTokenBalance(provider, makerAtaA);
    assert.equal(makerBalanceAfter, makerBalanceBefore + 1000000000);
  });

  it("Making another escrow with the same maker", async () => {
    seed = new anchor.BN(2);
    const signature = await provider.connection.requestAirdrop(
      maker.publicKey,
      5 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    [escrowPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("escrow"), maker.publicKey.toBuffer(), seed.toBuffer('le', 8)],
      program.programId
    );

    mintA = new Keypair();
    mintB = new Keypair();

    await createMint(provider, mintA);
    await createMint(provider, mintB);
    makerAtaA = await createAssociatedToken(provider, mintA.publicKey, maker.publicKey);
    vault = await getAssociatedTokenAddress(mintA.publicKey, escrowPDA, true);

    const mintToIx = createMintToInstruction(
      mintA.publicKey,
      makerAtaA,
      maker.publicKey,
      1_000_000_000
    );

    const mintTx = new anchor.web3.Transaction().add(mintToIx);
    await provider.sendAndConfirm(mintTx, [maker]);

    const deposit = new anchor.BN(1_000_000_000);
    const receive = new anchor.BN(1_000_000_000);

    try {
      let accountParams = {
        maker: maker.publicKey,
        mintA: mintA.publicKey,
        mintB: mintB.publicKey,
        makerAtaA: makerAtaA,
        escrow: escrowPDA,
        vault: vault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      } as any;

      const tx = await program.methods
        .make(seed, deposit, receive)
        .accounts(accountParams)
        .signers([maker])
        .rpc();

      console.log("Second Escrow Make successful, transaction signature:", tx);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }

    const escrowAccount = await program.account.escrow.fetch(escrowPDA);
    assert.equal(escrowAccount.seed.toString(), seed.toString());
    assert.equal(escrowAccount.maker.toString(), maker.publicKey.toString());
    assert.equal(escrowAccount.mintA.toString(), mintA.publicKey.toString());
    assert.equal(escrowAccount.mintB.toString(), mintB.publicKey.toString());
    assert.equal(escrowAccount.recieve.toString(), receive.toString());

    const vaultBalance = await getTokenBalance(provider, vault);
    assert.equal(vaultBalance, deposit.toNumber());
  });
});
