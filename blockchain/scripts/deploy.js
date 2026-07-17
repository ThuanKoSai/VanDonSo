const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploy bằng địa chỉ:", deployer.address);

  const Contract = await hre.ethers.getContractFactory("SupplyChainTraceability");
  const contract = await Contract.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("SupplyChainTraceability đã deploy tại:", address);

  console.log("\nBước tiếp theo:");
  console.log("1. Cập nhật CONTRACT_ADDRESS trong frontend/src/lib/contract.js");
  console.log("2. Copy ABI từ artifacts/contracts/SupplyChainTraceability.sol/SupplyChainTraceability.json");
  console.log("3. Verify contract: npx hardhat verify --network sepolia", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
