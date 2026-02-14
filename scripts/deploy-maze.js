/**
 * Maze Contract Deployment Script
 *
 * Usage:
 *   npx hardhat run scripts/deploy-maze.js --network celo
 *   npx hardhat run scripts/deploy-maze.js --network base
 */

const hre = require("hardhat");

async function main() {
  console.log("🏰 Deploying Maze contract...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying from account:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", hre.ethers.utils.formatEther(balance), "\n");

  console.log("🚀 Deploying contract...");
  const Maze = await hre.ethers.getContractFactory("Maze");
  const maze = await Maze.deploy();

  await maze.deployed();

  console.log("✅ Maze deployed to:", maze.address);
  console.log("📊 Transaction hash:", maze.deployTransaction.hash);

  console.log("\n⏳ Waiting for block confirmations...");
  await maze.deployTransaction.wait(5);

  console.log("✅ Contract confirmed!\n");

  console.log("📋 Contract Details:");
  console.log("   Address:", maze.address);
  console.log("   Network:", hre.network.name);
  console.log("   Game: Maze (labyrinth navigation)");
  console.log("   Difficulties: Easy (5×5), Medium (10×10), Hard (15×15)");
  console.log("   Fee: None (free to play)");

  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n🔍 Verify contract:");
    console.log(`   npx hardhat verify --network ${hre.network.name} ${maze.address}`);
  }

  console.log("\n📝 Next Steps:");
  console.log("1. Update lib/contracts/addresses.ts with contract address");
  console.log(`   maze: { ${hre.network.name}: '${maze.address}' }`);
  console.log("2. Test the contract on testnet before mainnet deployment");

  const deploymentInfo = {
    network: hre.network.name,
    address: maze.address,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    transactionHash: maze.deployTransaction.hash,
    blockNumber: maze.deployTransaction.blockNumber,
  };

  const fs = require('fs');
  const path = require('path');

  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(
    deploymentsDir,
    `maze-${hre.network.name}.json`
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
