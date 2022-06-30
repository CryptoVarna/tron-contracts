// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/TRC20/extensions/TRC20Votes.sol";

contract TRC20VotesMock is TRC20Votes {
    constructor(string memory name, string memory symbol)
        TRC20(name, symbol)
        TRC20Permit(name)
    {}

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) public {
        _burn(account, amount);
    }

    function getChainId() external view returns (uint256) {
        return block.chainid;
    }
}
