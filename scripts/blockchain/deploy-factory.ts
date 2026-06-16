/**
 * Deploy NjangiGroupFactory to the configured network.
 *
 * Usage:
 *   pnpm hardhat run scripts/blockchain/deploy-factory.ts --network localhost
 *   pnpm hardhat run scripts/blockchain/deploy-factory.ts --network polygonAmoy
 *
 * After deployment, copy the printed address into .env.local as:
 *   FACTORY_CONTRACT_ADDRESS=0x...
 */
import pkg from "hardhat"
const { ethers } = pkg as any

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("Deploying with account:", deployer.address)
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH/MATIC")

  const Factory = await ethers.getContractFactory("NjangiGroupFactory")
  const factory = await Factory.deploy()
  await factory.waitForDeployment()

  const address = await factory.getAddress()
  console.log("\nNjangiGroupFactory deployed to:", address)
  console.log("Add to .env.local:")
  console.log(`FACTORY_CONTRACT_ADDRESS=${address}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
