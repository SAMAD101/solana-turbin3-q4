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
    - Creates a new vault for the user.
  2. `deposit` \
    - Transfers SOL from user to vault account.
  3. `withdraw` \
    - Transfers SOL from vault to user account using PDA signer.

</details>

<details>
  <summary><b>anchor-escrow</b></summary>
  
  Escrow Solana program using Anchor for creating and managing escrow accounts.

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
    - Creates a new escrow account for the user.
  2. `refund` \
    -
  3. `take` \
    -
</details>
