// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NjangiGroupFactory
 * @notice Stores njangi group rules immutably on-chain and records each cycle completion.
 *         Rules are written once at group creation and can never be changed.
 *         Each payout cycle is recorded permanently so the full history is auditable.
 */
contract NjangiGroupFactory {
    struct GroupRules {
        string  name;
        uint256 contributionAmount; // in XAF
        string  frequency;          // "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY"
        string  payoutOrder;        // "SEQUENTIAL" | "LOTTERY"
        uint256 minMembers;
        uint256 maxMembers;         // 0 = no limit
        address creator;
        uint256 createdAt;
    }

    // groupId (keccak256 of the DB cuid) => immutable rules
    mapping(bytes32 => GroupRules) private _groups;

    // groupId => cycle number => recipient DB id hash
    mapping(bytes32 => mapping(uint256 => bytes32)) private _cycleRecipients;
    mapping(bytes32 => uint256) private _completedCycles;

    event GroupRulesLocked(
        bytes32 indexed groupId,
        address indexed creator,
        uint256 contributionAmount,
        string  frequency,
        string  payoutOrder
    );

    event CycleCompleted(
        bytes32 indexed groupId,
        uint256 indexed cycle,
        bytes32 recipientId,
        uint256 amount,
        uint256 memberCount,
        uint256 timestamp
    );

    event ContributionRecorded(
        bytes32 indexed groupId,
        uint256 indexed cycle,
        bytes32 indexed memberId,
        uint256 amount,
        bool isRecipientOffset, // true when recipient's share is auto-confirmed
        uint256 timestamp
    );

    function lockGroupRules(
        bytes32 groupId,
        string  calldata name,
        uint256 contributionAmount,
        string  calldata frequency,
        string  calldata payoutOrder,
        uint256 minMembers,
        uint256 maxMembers
    ) external {
        require(_groups[groupId].createdAt == 0, "Rules already locked for this group");
        require(contributionAmount > 0, "Contribution amount must be positive");
        require(minMembers >= 2, "Minimum members must be at least 2");
        require(maxMembers == 0 || maxMembers > minMembers, "Max must exceed min");

        _groups[groupId] = GroupRules({
            name:               name,
            contributionAmount: contributionAmount,
            frequency:          frequency,
            payoutOrder:        payoutOrder,
            minMembers:         minMembers,
            maxMembers:         maxMembers,
            creator:            msg.sender,
            createdAt:          block.timestamp
        });

        emit GroupRulesLocked(groupId, msg.sender, contributionAmount, frequency, payoutOrder);
    }

    /**
     * @notice Record that a contribution cycle has completed and a payout was made.
     *         Creates a permanent, public, auditable record of every payout.
     * @param groupId     keccak256 of the DB group ID
     * @param cycle       Cycle number (1, 2, 3 ...)
     * @param recipientId keccak256 of the DB recipient user ID
     * @param amount      Total XAF paid out (contributionAmount * memberCount)
     * @param memberCount Number of contributing members this cycle
     */
    /**
     * @notice Record that a member has made their contribution for a cycle.
     * @param isRecipientOffset true when the recipient's contribution is auto-confirmed
     *        (their share is offset against the payout they receive).
     */
    function recordContribution(
        bytes32 groupId,
        uint256 cycle,
        bytes32 memberId,
        uint256 amount,
        bool isRecipientOffset
    ) external {
        require(_groups[groupId].createdAt != 0, "Group not found");
        require(amount > 0, "Amount must be positive");

        emit ContributionRecorded(groupId, cycle, memberId, amount, isRecipientOffset, block.timestamp);
    }

    function recordCycleComplete(
        bytes32 groupId,
        uint256 cycle,
        bytes32 recipientId,
        uint256 amount,
        uint256 memberCount
    ) external {
        require(_groups[groupId].createdAt != 0, "Group not found");
        require(_cycleRecipients[groupId][cycle] == bytes32(0), "Cycle already recorded");
        require(amount > 0, "Amount must be positive");

        _cycleRecipients[groupId][cycle] = recipientId;
        _completedCycles[groupId] = cycle;

        emit CycleCompleted(groupId, cycle, recipientId, amount, memberCount, block.timestamp);
    }

    function getGroupRules(bytes32 groupId) external view returns (GroupRules memory) {
        require(_groups[groupId].createdAt != 0, "Group not found");
        return _groups[groupId];
    }

    function isLocked(bytes32 groupId) external view returns (bool) {
        return _groups[groupId].createdAt != 0;
    }

    function getCompletedCycles(bytes32 groupId) external view returns (uint256) {
        return _completedCycles[groupId];
    }

    function getCycleRecipient(bytes32 groupId, uint256 cycle) external view returns (bytes32) {
        return _cycleRecipients[groupId][cycle];
    }
}
