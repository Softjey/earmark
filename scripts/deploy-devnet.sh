#!/usr/bin/env bash
# Builds and deploys the program to devnet, then prints the program ID.
# Needs a funded devnet wallet (solana airdrop 5 --url devnet, or https://faucet.solana.com).
set -euo pipefail
cd "$(dirname "$0")/.."

anchor build
# Plain `solana program deploy`: `anchor deploy` also uploads the IDL via npx, which fails here.
# Do NOT redeploy casually: a deploy locks ~1.8 SOL of rent and devnet airdrops are limited.
solana program deploy target/deploy/earmark.so --program-id target/deploy/earmark-keypair.json --url devnet

PROGRAM_ID=$(solana address -k target/deploy/earmark-keypair.json)
echo
echo "Program ID: ${PROGRAM_ID}"
echo "Explorer:   https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet"
echo "Next: update README.md (Deployment table), then run: pnpm tsx scripts/create-mint.ts"
echo "Before the final demo (irreversible): solana program set-upgrade-authority ${PROGRAM_ID} --final --url devnet"
