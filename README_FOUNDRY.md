# Foundry NFT Setup (2heartpillows)

This setup gives you:
- `HeartPillowNFT` contract (`ERC-721` style, one NFT per `pillow_id`)
- deploy script
- mint script based on your tracking metadata URI

## 1. Install dependencies

```bash
forge install foundry-rs/forge-std --no-commit
```

## 2. Prepare env vars

```bash
cp .env.example .env
```

Edit `.env`:
- `PRIVATE_KEY`
- `AMOY_RPC_URL`

## 3. Compile

```bash
forge build
```

## 4. Deploy to Polygon Amoy

```bash
source .env
forge script script/Deploy.s.sol:DeployHeartPillowNFT \
  --rpc-url "$AMOY_RPC_URL" \
  --broadcast
```

Copy the deployed address to `NFT_CONTRACT_ADDRESS` in `.env`.

## 5. Mint one pillow NFT

Set in `.env`:
- `MINT_TO` = owner wallet
- `PILLOW_ID` = unique id (`HP-2026-001`)
- `TOKEN_URI` = IPFS URL of the JSON from your website tracking form

Run:

```bash
source .env
forge script script/MintFromTracking.s.sol:MintFromTracking \
  --rpc-url "$AMOY_RPC_URL" \
  --broadcast
```

## Data model in NFT contract

Stored on-chain:
- `pillowIdByTokenId[tokenId]`
- `tokenIdByPillowId[pillowId]`
- owner (`ownerOf(tokenId)`)

Stored off-chain in metadata JSON (`TOKEN_URI`):
- fabric origin
- fabric donor
- sewn by
- clinic
- recipient alias
- wallet owner

Important:
- Use alias/pseudonym for recipient to avoid personal health data on chain/IPFS.

