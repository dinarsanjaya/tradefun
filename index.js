const axios = require('axios');
const colors = require('colors');

class SolanaAirdropChecker {
    constructor() {
        this.apiUrl = 'https://api.trade.fun/api/airdrop/verify';
        this.tierStatsUrl = 'https://api.trade.fun/api/airdrop/tier-eligible-counts';
        this.headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };
    }

    // Validate Solana wallet address format
    isValidSolanaAddress(address) {
        // Basic Solana address validation (base58, 32-44 characters)
        const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
        return solanaAddressRegex.test(address);
    }

    // Format token amount with proper decimals
    formatTokenAmount(amount) {
        return parseFloat(amount).toLocaleString();
    }

    // Format volume/PnL values
    formatCurrency(value) {
        return parseFloat(value).toFixed(2);
    }

    // Display detailed wallet information
    displayWalletInfo(data) {
        console.log('\n' + '='.repeat(60).cyan);
        console.log('📊 WALLET AIRDROP STATUS'.bold.cyan);
        console.log('='.repeat(60).cyan);
        
        // Basic Info
        console.log(`🔗 Wallet Address: ${data.walletAddress}`.white);
        console.log(`✅ Eligible: ${data.eligible ? 'YES'.green : 'NO'.red}`);
        console.log(`🎁 Claimed: ${data.claimed ? 'YES'.yellow : 'NO'.green}`);
        console.log(`⏳ Claim Queued: ${data.claimQueued ? 'YES'.yellow : 'NO'.white}`);
        
        if (data.eligible) {
            console.log(`🏆 Tier: ${data.tier}`.cyan);
            console.log(`💰 Token Amount: ${this.formatTokenAmount(data.tokenAmount)} tokens`.green);
            console.log(`🆔 Claim ID: ${data.claimId}`.gray);
        }

        // Verification Status
        console.log('\n📋 VERIFICATION STATUS'.bold.yellow);
        console.log(`🔐 Wallet Verified: ${data.walletVerified ? 'YES'.green : 'NO'.red}`);
        console.log(`🔗 Account Linked: ${data.accountLinked ? 'YES'.green : 'NO'.red}`);
        if (data.linkedUsername) {
            console.log(`👤 Linked Username: ${data.linkedUsername}`.cyan);
        }

        // Trading Statistics - only show if wallet has trading data
        if (data.totalVolume !== undefined && data.totalVolume !== null) {
            console.log('\n📈 TRADING STATISTICS'.bold.blue);
            console.log(`💹 Total Volume: $${this.formatCurrency(data.totalVolume)}`.blue);
            console.log(`💰 PnL: $${this.formatCurrency(data.pnl || 0)}`.white);
            console.log(`🔢 Trade Count: ${data.tradeCount || 0}`.cyan);
            console.log(`💸 Fees Paid: $${this.formatCurrency(data.feesPaid || 0)}`.yellow);

            // Platform Breakdown - only show if platforms data exists
            if (data.platforms && typeof data.platforms === 'object') {
                console.log('\n🏢 PLATFORM BREAKDOWN'.bold.magenta);
                const hasActivePlatforms = Object.entries(data.platforms).some(([platform, stats]) => 
                    stats && (stats.trades > 0 || stats.volume > 0)
                );
                
                if (hasActivePlatforms) {
                    Object.entries(data.platforms).forEach(([platform, stats]) => {
                        if (stats && (stats.trades > 0 || stats.volume > 0)) {
                            console.log(`  ${platform}:`.bold);
                            console.log(`    📊 Volume: $${this.formatCurrency(stats.volume || 0)}`);
                            console.log(`    🔢 Trades: ${stats.trades || 0}`);
                            console.log(`    💰 PnL: $${this.formatCurrency(stats.pnl || 0)}`);
                            if (stats.fees) {
                                console.log(`    💸 Fees: $${this.formatCurrency(stats.fees)}`);
                            }
                        }
                    });
                } else {
                    console.log(`  No trading activity found`.gray);
                }
            }
        } else {
            console.log('\n📈 TRADING STATISTICS'.bold.blue);
            console.log(`  No trading data available for this wallet`.gray);
        }

        // Airdrop Details
        if (data.eligible) {
            console.log('\n🎯 AIRDROP DETAILS'.bold.green);
            console.log(`📅 Campaign: ${data.campaignId}`.green);
            console.log(`🎫 Remaining Claims: ${data.remainingClaims}`.cyan);
            if (data.message) {
                console.log(`💬 Message: ${data.message}`.white);
            }
        }

        console.log('='.repeat(60).cyan + '\n');
    }

    // Check single wallet
    async checkWallet(walletAddress) {
        try {
            if (!this.isValidSolanaAddress(walletAddress)) {
                throw new Error('Invalid Solana wallet address format');
            }

            console.log(`🔍 Checking wallet: ${walletAddress}...`.yellow);

            const response = await axios.post(this.apiUrl, {
                walletAddress: walletAddress
            }, {
                headers: this.headers,
                timeout: 10000
            });

            if (response.data.success) {
                this.displayWalletInfo(response.data);
                return response.data;
            } else {
                console.log(`❌ Failed to check wallet: ${walletAddress}`.red);
                return null;
            }

        } catch (error) {
            console.log(`❌ Error checking wallet ${walletAddress}:`.red);
            if (error.response) {
                const status = error.response.status;
                if (status === 429) {
                    console.log(`   Status: ${status} - Rate Limited`.red);
                    console.log(`   Message: Too many requests. Please wait a moment and try again.`.red);
                } else if (status === 404) {
                    console.log(`   Status: ${status} - Not Found`.red);
                    console.log(`   Message: API endpoint not found.`.red);
                } else if (status === 500) {
                    console.log(`   Status: ${status} - Server Error`.red);
                    console.log(`   Message: Internal server error. Please try again later.`.red);
                } else {
                    console.log(`   Status: ${status}`.red);
                    console.log(`   Message: ${error.response.data?.message || 'Unknown API error'}`.red);
                }
            } else if (error.request) {
                console.log(`   Network error: Unable to reach API server`.red);
                console.log(`   Please check your internet connection and try again.`.red);
            } else {
                console.log(`   Error: ${error.message}`.red);
            }
            return null;
        }
    }

    // Check multiple wallets
    async checkMultipleWallets(walletAddresses) {
        console.log(`🚀 Starting batch check for ${walletAddresses.length} wallets...\n`.cyan);
        
        const results = [];
        let rateLimitDelay = 1000; // Start with 1 second delay
        
        for (let i = 0; i < walletAddresses.length; i++) {
            const wallet = walletAddresses[i].trim();
            console.log(`[${i + 1}/${walletAddresses.length}]`.gray);
            
            const result = await this.checkWallet(wallet);
            
            // If rate limited, increase delay
            if (result === null && i > 0) {
                rateLimitDelay = Math.min(rateLimitDelay * 1.5, 5000); // Max 5 seconds
                console.log(`⏳ Increasing delay to ${rateLimitDelay/1000}s due to rate limiting...`.yellow);
            }
            
            results.push({
                wallet,
                data: result,
                eligible: result?.eligible || false,
                tokenAmount: result?.tokenAmount || '0'
            });

            // Add delay between requests to avoid rate limiting
            if (i < walletAddresses.length - 1) {
                await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
            }
        }

        // Summary
        this.displaySummary(results);
        return results;
    }

    // Get tier statistics
    async getTierStats() {
        try {
            console.log('📊 Fetching tier statistics...'.yellow);
            
            const response = await axios.get(this.tierStatsUrl, {
                headers: this.headers,
                timeout: 10000
            });

            if (response.data.success) {
                return response.data.data;
            } else {
                console.log('❌ Failed to fetch tier statistics'.red);
                return null;
            }
        } catch (error) {
            console.log('❌ Error fetching tier statistics:'.red);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`.red);
            } else if (error.request) {
                console.log('   Network error: Unable to reach API'.red);
            } else {
                console.log(`   Error: ${error.message}`.red);
            }
            return null;
        }
    }

    // Display tier statistics
    displayTierStats(tierData) {
        console.log('\n' + '='.repeat(60).cyan);
        console.log('🏆 AIRDROP TIER STATISTICS'.bold.cyan);
        console.log('='.repeat(60).cyan);

        console.log(`📊 Total Eligible Wallets: ${tierData.total.toLocaleString()}`.bold.white);
        console.log('');

        // Display each tier
        Object.entries(tierData)
            .filter(([tier, count]) => tier !== 'total' && count > 0)
            .sort(([a], [b]) => {
                const numA = parseInt(a.replace('tier', ''));
                const numB = parseInt(b.replace('tier', ''));
                return numA - numB;
            })
            .forEach(([tier, count]) => {
                const tierNum = tier.replace('tier', '');
                const percentage = ((count / tierData.total) * 100).toFixed(2);
                
                let tierColor = 'white';
                if (tierNum <= '3') tierColor = 'green';
                else if (tierNum <= '6') tierColor = 'yellow';
                else if (tierNum <= '10') tierColor = 'cyan';
                else tierColor = 'magenta';

                console.log(`🏆 Tier ${tierNum}: ${count.toLocaleString()} wallets (${percentage}%)`[tierColor]);
            });

        console.log('='.repeat(60).cyan + '\n');
    }

    // Display batch check summary
    displaySummary(results) {
        console.log('\n' + '='.repeat(60).cyan);
        console.log('📊 BATCH CHECK SUMMARY'.bold.cyan);
        console.log('='.repeat(60).cyan);

        const eligible = results.filter(r => r.eligible);
        const totalTokens = eligible.reduce((sum, r) => sum + parseFloat(r.tokenAmount || 0), 0);

        console.log(`📝 Total Wallets Checked: ${results.length}`.white);
        console.log(`✅ Eligible Wallets: ${eligible.length}`.green);
        console.log(`❌ Not Eligible: ${results.length - eligible.length}`.red);
        console.log(`💰 Total Tokens: ${this.formatTokenAmount(totalTokens)}`.yellow);

        if (eligible.length > 0) {
            console.log('\n🎁 ELIGIBLE WALLETS:'.bold.green);
            eligible.forEach((result, index) => {
                console.log(`  ${index + 1}. ${result.wallet} - ${this.formatTokenAmount(result.tokenAmount)} tokens`.green);
            });
        }

        console.log('='.repeat(60).cyan + '\n');
    }

    // Main execution function
    async run() {
        console.log('🌟 Solana Airdrop Checker - Trade.fun'.bold.cyan);
        console.log('='.repeat(50).cyan + '\n');

        const args = process.argv.slice(2);
        
        if (args.length === 0) {
            console.log('Usage:'.bold);
            console.log('  Single wallet: node index.js <wallet_address>');
            console.log('  Multiple wallets: node index.js <wallet1> <wallet2> <wallet3>...');
            console.log('  From file: node index.js --file wallets.txt');
            console.log('  Tier statistics: node index.js --stats\n');
            console.log('Example:'.bold);
            console.log('  node index.js 2GpQzcKVQ6ggaqS5FYnKefTexNaHcAsXX8FYbWgbRaSN');
            console.log('  node index.js --stats\n');
            return;
        }

        if (args[0] === '--stats') {
            // Show tier statistics
            const tierData = await this.getTierStats();
            if (tierData) {
                this.displayTierStats(tierData);
            }
        } else if (args[0] === '--file' && args[1]) {
            // Read wallets from file
            try {
                const fs = require('fs');
                const fileContent = fs.readFileSync(args[1], 'utf8');
                const wallets = fileContent.split('\n').filter(line => line.trim());
                await this.checkMultipleWallets(wallets);
            } catch (error) {
                console.log(`❌ Error reading file: ${error.message}`.red);
            }
        } else if (args.length === 1) {
            // Single wallet check
            await this.checkWallet(args[0]);
        } else {
            // Multiple wallets check
            await this.checkMultipleWallets(args);
        }
    }
}

// Run the checker
if (require.main === module) {
    const checker = new SolanaAirdropChecker();
    checker.run().catch(console.error);
}

module.exports = SolanaAirdropChecker;
