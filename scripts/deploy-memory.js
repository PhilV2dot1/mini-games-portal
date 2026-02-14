/**
 * Memory Contract Deployment Script
 *
 * Usage:
 *   npx hardhat run scripts/deploy-memory.js --network celo
 *   npx hardhat run scripts/deploy-memory.js --network base
 */

const hre = require("hardhat");

async function main() {
  console.log("🧠 Deploying Memory contract...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying from account:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", hre.ethers.utils.formatEther(balance), "\n");

  console.log("🚀 Deploying contract...");
  const Memory = await hre.ethers.getContractFactory("Memory");
  const memory = await Memory.deploy();

  await memory.deployed();

  console.log("✅ Memory deployed to:", memory.address);
  console.log("📊 Transaction hash:", memory.deployTransaction.hash);

  console.log("\n⏳ Waiting for block confirmations...");
  await memory.deployTransaction.wait(5);

  console.log("✅ Contract confirmed!\n");

  console.log("📋 Contract Details:");
  console.log("   Address:", memory.address);
  console.log("   Network:", hre.network.name);
  console.log("   Game: Memory (card matching)");
  console.log("   Difficulties: Easy (3×4), Medium (4×4), Hard (5×4)");
  console.log("   Fee: None (free to play)");

  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n🔍 Verify contract:");
    console.log(`   npx hardhat verify --network ${hre.network.name} ${memory.address}`);
  }

  console.log("\n📝 Next Steps:");
  console.log("1. Update lib/contracts/addresses.ts with contract address");
  console.log(`   memory: { ${hre.network.name}: '${memory.address}' }`);
  console.log("2. Test the contract on testnet before mainnet deployment");

  const deploymentInfo = {
    network: hre.network.name,
    address: memory.address,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    transactionHash: memory.deployTransaction.hash,
    blockNumber: memory.deployTransaction.blockNumber,
  };

  const fs = require('fs');
  const path = require('path');

  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(
    deploymentsDir,
    `memory-${hre.network.name}.json`
  );

  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
