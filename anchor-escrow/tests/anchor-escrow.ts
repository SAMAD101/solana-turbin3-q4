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
  let mint = new Keypair();
  let makerAta: PublicKey;
  let takerAta: PublicKey;

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

    await createMint(provider, mint);
    makerAta = await createAssociatedToken(provider, mint.publicKey, maker.publicKey);
    vault = await getAssociatedTokenAddress(mint.publicKey, escrowPDA, true);

    const mintToIx = createMintToInstruction(
      mint.publicKey,
      makerAta,
      maker.publicKey,
      1_000_000_000
    );

    const mintTx = new anchor.web3.Transaction().add(mintToIx);
    await provider.sendAndConfirm(mintTx, [maker]);
  });

  it("Making a new escrow", async () => {
    const deposit = new anchor.BN(1_000_000_000);

    try {
      let accountParams = {
        maker: maker.publicKey,
        mint: mint.publicKey,
        makerAta: makerAta,
        escrow: escrowPDA,
        vault: vault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      } as any;

      const tx = await program.methods
        .make(seed, deposit)
        .accounts(accountParams)
        .signers([maker])
        .rpc();

      console.log("Escrow Make successful, transaction signature:", tx);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }

    const vaultBalance = await getTokenBalance(provider, vault);
    assert.equal(vaultBalance, deposit.toNumber());
  });

  it("Refunding escrow", async () => {
    const makerBalanceBefore = await getTokenBalance(provider, makerAta);

    try {
      let accountParams = {
        maker: maker.publicKey,
        mintA: mint.publicKey,
        makerAta: makerAta,
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

    const makerBalanceAfter = await getTokenBalance(provider, makerAta);
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

    mint = new Keypair();

    await createMint(provider, mint);
    makerAta = await createAssociatedToken(provider, mint.publicKey, maker.publicKey);
    vault = await getAssociatedTokenAddress(mint.publicKey, escrowPDA, true);

    const mintToIx = createMintToInstruction(
      mint.publicKey,
      makerAta,
      maker.publicKey,
      1_000_000_000
    );

    const mintTx = new anchor.web3.Transaction().add(mintToIx);
    await provider.sendAndConfirm(mintTx, [maker]);

    const deposit = new anchor.BN(1_000_000_000);

    try {
      let accountParams = {
        maker: maker.publicKey,
        mint: mint.publicKey,
        makerAta: makerAta,
        escrow: escrowPDA,
        vault: vault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId
      } as any;

      const tx = await program.methods
        .make(seed, deposit)
        .accounts(accountParams)
        .signers([maker])
        .rpc();

      console.log("Second Escrow Make successful, transaction signature:", tx);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }

    const vaultBalance = await getTokenBalance(provider, vault);
    assert.equal(vaultBalance, deposit.toNumber());
  });

  it("Taking escrow", async () => {
    const signature = await provider.connection.requestAirdrop(
      taker.publicKey,
      5 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    takerAta = await createAssociatedToken(provider, mint.publicKey, taker.publicKey);

    let accountParams = {
      taker: taker.publicKey,
      maker: maker.publicKey,
      mint: mint.publicKey,
      takerAta: takerAta,
      escrow: escrowPDA,
      vault: vault,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId
    } as any;

    try {
      const tx = await program.methods
        .take()
        .accounts(accountParams)
        .signers([taker])
        .rpc();

      console.log("Escrow Take successful, transaction signature:", tx);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }

    const takerBalance = await getTokenBalance(provider, takerAta);
    assert.equal(takerBalance, 1_000_000_000);
  });
});
