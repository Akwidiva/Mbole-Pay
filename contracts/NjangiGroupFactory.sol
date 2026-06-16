// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NjangiGroupFactory
 * @notice Stores njangi group rules immutably on-chain.
 *         Rules are written once at group creation and can never be changed.
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

    event GroupRulesLocked(
        bytes32 indexed groupId,
        address indexed creator,
        uint256 contributionAmount,
        string  frequency,
        string  payoutOrder
    );

    /**
     * @notice Lock group rules on-chain. Can only be called once per groupId.
     * @param groupId      keccak256 hash of the database group ID
     * @param name         Human-readable group name
     * @param contributionAmount Amount in XAF each member contributes
     * @param frequency    Contribution frequency string
     * @param payoutOrder  "SEQUENTIAL" or "LOTTERY"
     * @param minMembers   Minimum members required
     * @param maxMembers   Maximum members allowed (0 = unlimited)
     */
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
     * @notice Read the immutable rules for a group.
     */
    function getGroupRules(bytes32 groupId) external view returns (GroupRules memory) {
        require(_groups[groupId].createdAt != 0, "Group not found");
        return _groups[groupId];
    }

    /**
     * @notice Check if rules have been locked for a group.
     */
    function isLocked(bytes32 groupId) external view returns (bool) {
        return _groups[groupId].createdAt != 0;
    }
}
