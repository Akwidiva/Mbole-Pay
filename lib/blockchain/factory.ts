import { ethers } from "ethers"

const ABI = [
  "function lockGroupRules(bytes32 groupId, string name, uint256 contributionAmount, string frequency, string payoutOrder, uint256 minMembers, uint256 maxMembers) external",
  "function recordContribution(bytes32 groupId, uint256 cycle, bytes32 memberId, uint256 amount, bool isRecipientOffset) external",
  "function recordCycleComplete(bytes32 groupId, uint256 cycle, bytes32 recipientId, uint256 amount, uint256 memberCount) external",
  "function getGroupRules(bytes32 groupId) external view returns (tuple(string name, uint256 contributionAmount, string frequency, string payoutOrder, uint256 minMembers, uint256 maxMembers, address creator, uint256 createdAt))",
  "function isLocked(bytes32 groupId) external view returns (bool)",
  "function getCompletedCycles(bytes32 groupId) external view returns (uint256)",
  "function getCycleRecipient(bytes32 groupId, uint256 cycle) external view returns (bytes32)",
  "event GroupRulesLocked(bytes32 indexed groupId, address indexed creator, uint256 contributionAmount, string frequency, string payoutOrder)",
  "event CycleCompleted(bytes32 indexed groupId, uint256 indexed cycle, bytes32 recipientId, uint256 amount, uint256 memberCount, uint256 timestamp)",
]

function getProvider() {
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL
  if (!rpcUrl) throw new Error("BLOCKCHAIN_RPC_URL is not set")
  return new ethers.JsonRpcProvider(rpcUrl)
}

function getContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  const address = process.env.FACTORY_CONTRACT_ADDRESS
  if (!address) throw new Error("FACTORY_CONTRACT_ADDRESS is not set")
  const connection = signerOrProvider ?? getProvider()
  return new ethers.Contract(address, ABI, connection)
}

function getSigner() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY
  if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY is not set")
  return new ethers.Wallet(privateKey, getProvider())
}

/** Convert a DB cuid string to bytes32 (keccak256 hash) */
export function dbIdToBytes32(id: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(id))
}

export interface LockResult {
  txHash: string
  blockNumber: number
  onChainGroupId: string // the bytes32 key used on-chain
}

/**
 * Lock group rules on-chain. Called automatically during group creation.
 * Returns the tx hash and on-chain group ID to store in the DB.
 * Throws if blockchain is not configured (caller should handle gracefully in dev).
 */
export async function lockGroupRulesOnChain(params: {
  dbGroupId: string
  name: string
  contributionAmount: number
  frequency: string
  payoutOrder: string
  minMembers: number
  maxMembers: number | null
}): Promise<LockResult> {
  const signer = getSigner()
  const contract = getContract(signer)

  const onChainGroupId = dbIdToBytes32(params.dbGroupId)

  // Contract requires maxMembers to be 0 (unlimited) or strictly greater than
  // minMembers — a group with maxMembers === minMembers (e.g. a fixed-size
  // group) must be represented as "unlimited" on-chain since there's no way
  // to express "exactly N" separately from "at least N" in this schema.
  const chainMaxMembers = params.maxMembers && params.maxMembers > params.minMembers ? params.maxMembers : 0

  const tx = await contract.lockGroupRules(
    onChainGroupId,
    params.name,
    BigInt(params.contributionAmount),
    params.frequency,
    params.payoutOrder,
    BigInt(params.minMembers),
    BigInt(chainMaxMembers)
  )

  const receipt = await tx.wait()

  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    onChainGroupId,
  }
}

/**
 * Read the immutable rules for a group from the chain.
 */
export async function getGroupRulesFromChain(dbGroupId: string) {
  const contract = getContract()
  const onChainGroupId = dbIdToBytes32(dbGroupId)
  const rules = await contract.getGroupRules(onChainGroupId)
  return {
    name:               rules.name,
    contributionAmount: Number(rules.contributionAmount),
    frequency:          rules.frequency,
    payoutOrder:        rules.payoutOrder,
    minMembers:         Number(rules.minMembers),
    maxMembers:         Number(rules.maxMembers),
    creator:            rules.creator,
    createdAt:          new Date(Number(rules.createdAt) * 1000),
  }
}

/**
 * Record a single member contribution on-chain.
 * isRecipientOffset = true when the recipient's contribution is auto-confirmed.
 * Non-fatal — caller should catch and log.
 */
export async function recordContributionOnChain(params: {
  dbGroupId: string
  cycle: number
  dbMemberId: string
  amount: number
  isRecipientOffset: boolean
}): Promise<string> {
  const signer = getSigner()
  const contract = getContract(signer)

  const onChainGroupId = dbIdToBytes32(params.dbGroupId)
  const onChainMemberId = dbIdToBytes32(params.dbMemberId)

  const tx = await contract.recordContribution(
    onChainGroupId,
    BigInt(params.cycle),
    onChainMemberId,
    BigInt(params.amount),
    params.isRecipientOffset
  )

  const receipt = await tx.wait()
  return receipt.hash
}

/**
 * Record a completed payout cycle on-chain.
 * Emits a CycleCompleted event that is permanently stored on Polygon.
 * Non-fatal — caller should catch and log.
 */
export async function recordCycleOnChain(params: {
  dbGroupId: string
  cycle: number
  dbRecipientId: string
  amount: number
  memberCount: number
}): Promise<string> {
  const signer = getSigner()
  const contract = getContract(signer)

  const onChainGroupId = dbIdToBytes32(params.dbGroupId)
  const onChainRecipientId = dbIdToBytes32(params.dbRecipientId)

  const tx = await contract.recordCycleComplete(
    onChainGroupId,
    BigInt(params.cycle),
    onChainRecipientId,
    BigInt(params.amount),
    BigInt(params.memberCount)
  )

  const receipt = await tx.wait()
  return receipt.hash
}

/** True if blockchain env vars are configured. */
export function isBlockchainConfigured(): boolean {
  return !!(
    process.env.BLOCKCHAIN_RPC_URL &&
    process.env.FACTORY_CONTRACT_ADDRESS &&
    process.env.DEPLOYER_PRIVATE_KEY
  )
}
