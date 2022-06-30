// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/TRC20/extensions/TRC20Capped.sol";

contract TRC20CappedMock is TRC20Capped {
    constructor(
        string memory name,
        string memory symbol,
        uint256 cap
    ) TRC20(name, symbol) TRC20Capped(cap) {}

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
}
