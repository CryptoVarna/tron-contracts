// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/TRC20/extensions/TRC20Wrapper.sol";

contract TRC20WrapperMock is TRC20Wrapper {
    constructor(
        ITRC20 _underlyingToken,
        string memory name,
        string memory symbol
    ) TRC20(name, symbol) TRC20Wrapper(_underlyingToken) {}

    function recover(address account) public returns (uint256) {
        return _recover(account);
    }
}
