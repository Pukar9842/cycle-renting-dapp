const hre = require("hardhat");

async function main() {
  console.log("🔑 Hardhat Test Accounts:");
  console.log("==========================");

  const accounts = await hre.ethers.getSigners();

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const balance = await hre.ethers.provider.getBalance(account.address);
    console.log(`Account ${i}: ${account.address}`);
    console.log(`Private Key: ${account.privateKey}`);
    console.log(`Balance: ${hre.ethers.formatEther(balance)} ETH`);
    console.log("---");
  }

  console.log("\n📝 Instructions:");
  console.log("1. Copy any private key above");
  console.log("2. In MetaMask, click the account icon → 'Import Account'");
  console.log("3. Paste the private key and click 'Import'");
  console.log("4. Switch to 'Hardhat Local' network");
  console.log("5. You should see 10,000 ETH in your account!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
