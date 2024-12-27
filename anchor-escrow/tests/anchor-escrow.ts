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
  mintTo
} from "@solana/spl-token";
import { assert } from "chai";

import { AnchorEscrow } from "../target/types/anchor_escrow";
import { publicKey } from "@coral-xyz/anchor/dist/cjs/utils";

describe("anchor-escrow-q424", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AnchorEscrow as Program<AnchorEscrow>;

  let maker: Signer;
  let seed = new anchor.BN(1);
  let escrowPDA: PublicKey;
  let escrowBump: number;
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
        provider.wallet.publicKey,
        provider.wallet.publicKey
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
    const account = await provider.connection.getTokenAccountBalance(ata);
    return +account.value.amount;
  };

  before(async () => {
    [escrowPDA, escrowBump] = await PublicKey.findProgramAddress(
      [Buffer.from("state"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    await createMint(provider, mintA);
    await createMint(provider, mintB);
    const makerAtaA = await createAssociatedToken(provider, mintA.publicKey, maker.publicKey);
  });

  it("Making a new escrow", async () => {
    
    const deposit = new anchor.BN(1_000_000_000);
    const receive = new anchor.BN(1_000_000_000);

    await mintTo(
      provider.connection,
      maker,
      mintA.publicKey,
      makerAtaA,
      maker,
      deposit.toNumber()
    );

    let accountParams = {
      maker: maker,
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
      .rpc();
  });
});
