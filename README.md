# Turbin3 Q4 2024 personal repo

This is my personal repository for the Turbin3 Q4 2024 Builders Program.

## Capstone project program: https://github.com/hivemind-cool/voting-pogram

The capstone project is made by me throughout the cohort. I'm continuing 
to building and expanding the project after the program ended.

## Builders Program Projects

<details>
  <summary><b>anchor-vault</b></summary>
  
  Vault Solana program using Anchor for depositing and withdrawing SOL into a secure vault.

  Check out the project [here](./anchor-vault/).

  Devnet address: https://explorer.solana.com/address/9goRBncXFdF6D9GsbyGnZxgHoMGquvcesz1kEURaqsMe?cluster=devnet

  ### Setup

  1. Clone the repository
  ```bash
  git clone https://github.com/SAMAD101/solana-turbin3-q4.git
  ```
  2. Change directory to the project
  ```bash
  cd solana-turbin3-q4/anchor-vault
  ```
  3. Build the project
  ```bash
  anchor build
  ```
  4. Install dependencies
  ```bash
  yarn install
  ```
  5. Run tests
  ```bash
  anchor test
  ```

  #### Instructions:

  1. `initialize` \
    - Creates a new vault for the user. \
    - **Context:** `User` \
    - **Accounts:** `user` (Signer<'info>), `state` (Account<'info, VaultState>), `vault` (SystemAccount<'info>), `system_program` (Program<'info, System>)
  2. `deposit` \
    - Transfers SOL from user to vault account. \
    - **Context:** `Payment` \
    - **Parameters:** `amount` (u64) \
    - **Accounts:** `user` (Signer<'info>), `state` (Account<'info, VaultState>), `vault` (SystemAccount<'info>), `system_program` (Program<'info, System>')
  3. `withdraw` \
    - Transfers SOL from vault to user account. \
    - **Context:** `Payment` \
    - **Parameters:** `amount` (u64) \
    - **Accounts:** `user` (Signer<'info>), `state` (Account<'info, VaultState>), `vault` (SystemAccount<'info>), `system_program` (Program<'info, System>')
  
  #### States:

  1. `VaultState` \
    - Represents the state of the vault. \
    - **Fields:** vault_bump (u8), state_bump (u8)

</details>

<details>
  <summary><b>anchor-escrow</b></summary>
  
  Escrow Solana program using Anchor for escrow transactions between two parties for a trade of SPL tokens.

  Check out the project [here](./anchor-escrow/).

  Devnet address: https://explorer.solana.com/address/GudvSt9dEMQtjaWaVCdwy3nT5NvXr3VZMeDXZocYkHd5?cluster=devnet

  ### Setup

  1. Clone the repository
  ```bash
  git clone https://github.com/SAMAD101/solana-turbin3-q4.git
  ```
  2. Change directory to the project
  ```bash
  cd solana-turbin3-q4/anchor-escrow
  ```
  3. Build the project
  ```bash
  anchor build
  ```
  4. Install dependencies
  ```bash
  yarn install
  ```
  5. Run tests
  ```bash
  anchor test
  ```

  #### Instructions:

  1. `make` \
    - Makes a new escrow state with a new vault. A single maker can have any number of escrows with different seeds. \
    - **Context:** `Maker` \
    - **Parameters**: `seed` (u64), `deposit` (u64) \
    - **Accounts:** `maker` (Signer<'info>), `mint`  (InterfaceAccount<'info, Mint>), `maker_ata` (InterfaceAccount<'info, TokenAccount>), `escrow` (Account<'info, Escrow>), `vault` (InterfaceAccount<'info, TokenAccount>), `associated_token_program` (Program<'info, AssociatedToken>), `token_program` (Interface<'info, TokenInterface>), `system_program` (Program<'info, System>)
  2. `refund` \
    - Refunds the tokens in the vault back to the maker. \
    - **Context:** `Refund` \
    - **Accounts:** `maker` (Signer<'info>), `mint` (InterfaceAccount<'info, Mint>), `maker_ata` (InterfaceAccount<'info, TokenAccount>), `escrow` (Account<'info, Escrow>), `vault` (InterfaceAccount<'info, TokenAccount>), `associated_token_program` (Program<'info, AssociatedToken>), `token_program` (Interface<'info, TokenInterface>), `system_program` (Program<'info, System>)
  3. `take` \
    - Transfers the tokens from the vault to the taker. \
    - **Context:** `Taker` \
    - **Accounts:** `taker` (Signer<'info>), `maker` \(AccountInfo<'info>), `mint` (InterfaceAccount<'info, Mint>), `maker_ata` (InterfaceAccount<'info, TokenAccount>), `taker_ata` (InterfaceAccount<'info, TokenAccount>), `escrow` (Account<'info, Escrow>), `vault` (InterfaceAccount<'info, TokenAccount>), `associated_token_program` (Program<'info, AssociatedToken>), `token_program` (Interface<'info, TokenInterface>), `system_program` (Program<'info, System>)

  #### States:

  1. `Escrow` \
    - Represents the state of the escrow. \
    - **Fields:** seed (u64), maker (Pubkey), mint (Pubkey), bump (u8)
</details>


### more updates coming soon...