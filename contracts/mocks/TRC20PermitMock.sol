// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/TRC20/extensions/draft-TRC20Permit.sol";

contract TRC20PermitMock is TRC20Permit {
    constructor(
        string memory name,
        string memory symbol,
        address initialAccount,
        uint256 initialBalance
    ) payable TRC20(name, symbol) TRC20Permit(name) {
        _mint(initialAccount, initialBalance);
    }

    function getChainId() external view returns (uint256) {
        return block.chainid;
    }
}
