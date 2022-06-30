// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/TRC20/extensions/TRC20Snapshot.sol";

contract TRC20SnapshotMock is TRC20Snapshot {
    constructor(
        string memory name,
        string memory symbol,
        address initialAccount,
        uint256 initialBalance
    ) TRC20(name, symbol) {
        _mint(initialAccount, initialBalance);
    }

    function snapshot() public {
        _snapshot();
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) public {
        _burn(account, amount);
    }

    function totalSupplyAtMock(uint256 snapshotId) public returns (uint256) {
        return totalSupplyAt(snapshotId);
    }

    function balanceOfAtMock(address account, uint256 snapshotId)
        public
        returns (uint256)
    {
        return balanceOfAt(account, snapshotId);
    }
}
