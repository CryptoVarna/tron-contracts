// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./TRC20CappedMock.sol";

contract TRC20CappedFailMock {
    TRC20CappedMock public _mock;

    function mockConstructor(
        string memory name,
        string memory symbol,
        uint256 cap
    ) public {
        _mock = new TRC20CappedMock(name, symbol, cap);
    }
}
