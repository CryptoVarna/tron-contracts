// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/TRC20/extensions/TRC10Wrapper.sol";

contract TRC10WrapperMock is TRC10Wrapper {
    constructor(
        trcToken _underlyingToken,
        string memory name,
        string memory symbol
    ) TRC20(name, symbol) TRC10Wrapper(_underlyingToken) {}

    function recover(address account) public returns (uint256) {
        return _recover(account);
    }
}
