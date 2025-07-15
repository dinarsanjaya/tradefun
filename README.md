# Solana Airdrop Checker - Trade.fun

A comprehensive checker tool for verifying Solana wallet eligibility for Trade.fun airdrops with multiple versions to handle rate limiting.

## Features

- ✅ Single wallet verification
- ✅ Batch wallet checking
- ✅ Detailed trading statistics
- ✅ Platform breakdown analysis
- ✅ Tier statistics overview
- ✅ Colorized console output
- ✅ Error handling and validation
- ✅ File input support
- ✅ Multiple anti-rate limiting strategies

## Installation

1. Install dependencies:
```bash
npm install
```

## Available Versions

### 1. Standard Version (`index.js`)
Basic version with standard error handling and adaptive delays.
```bash
node index.js <wallet_address>
```

### 2. Anti-Rate Limit Version (`index-no-proxy.js`) - **RECOMMENDED**
Enhanced version with smart delays, user agent rotation, and advanced retry mechanism.
```bash
node index-no-proxy.js <wallet_address>
```

### 3. Proxy Version (`index-proxy.js`)
Advanced version with proxy rotation (requires working proxy servers).
```bash
node index-proxy.js <wallet_address>
```

## Usage

### Single Wallet Check
```bash
# Standard version
node index.js 2GpQzcKVQ6ggaqS5FYnKefTexNaHcAsXX8FYbWgbRaSN

# Anti-rate limit version (recommended)
node index-no-proxy.js 2GpQzcKVQ6ggaqS5FYnKefTexNaHcAsXX8FYbWgbRaSN

# Proxy version
node index-proxy.js 2GpQzcKVQ6ggaqS5FYnKefTexNaHcAsXX8FYbWgbRaSN
```

### Multiple Wallets Check
```bash
node index-no-proxy.js wallet1 wallet2 wallet3
```

### Check from File
Create a text file with wallet addresses (one per line):
```bash
node index-no-proxy.js --file wallets.txt
```

### View Tier Statistics
Get overall airdrop tier distribution:
```bash
node index-no-proxy.js --stats
```

## API Response Information

The checker displays comprehensive information including:

### Airdrop Status
- Eligibility status
- Claim status and queue status
- Token tier and amount
- Claim ID for tracking

### Verification Details
- Wallet verification status
- Account linking status
- Linked username (if applicable)

### Trading Statistics
- Total trading volume
- Profit/Loss (PnL)
- Number of trades
- Fees paid

### Platform Breakdown
Detailed statistics for each supported platform:
- GMGN, Mevx, Nova, Axiom
- Bullx, Photon, Trojan
- Maestro, Banana Gun

### Example Output
```
============================================================
📊 WALLET AIRDROP STATUS
============================================================
🔗 Wallet Address: 2GpQzcKVQ6ggaqS5FYnKefTexNaHcAsXX8FYbWgbRaSN
✅ Eligible: YES
🎁 Claimed: NO
⏳ Claim Queued: NO
🏆 Tier: 1
💰 Token Amount: 600 tokens
🆔 Claim ID: e4f1b4bb-2796-4297-956f-9f841522caec

📋 VERIFICATION STATUS
🔐 Wallet Verified: NO
🔗 Account Linked: NO

📈 TRADING STATISTICS
💹 Total Volume: $677.92
💰 PnL: $0.00
🔢 Trade Count: 51
💸 Fees Paid: $6.80

🏢 PLATFORM BREAKDOWN
  Bullx:
    📊 Volume: $677.92
    🔢 Trades: 51
    💰 PnL: $0.00
    💸 Fees: $6.80

🎯 AIRDROP DETAILS
📅 Campaign: launch_airdrop
🎫 Remaining Claims: 5000
💬 Message: Wallet is eligible for airdrop. 5000 spots remaining in tier 1.
============================================================
```

## Error Handling

The tool includes comprehensive error handling for:
- Invalid wallet address formats
- Network connectivity issues
- API rate limiting
- Invalid API responses

## Requirements

- Node.js 14+ 
- Internet connection for API access

## API Endpoints

This tool uses the following Trade.fun API endpoints:
```
POST https://api.trade.fun/api/airdrop/verify
GET https://api.trade.fun/api/airdrop/tier-eligible-counts
```

## License

MIT License
