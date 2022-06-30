// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Multicall.sol";
import "./TRC20Mock.sol";

contract MulticallTokenMock is TRC20Mock, Multicall {
    constructor(uint256 initialBalance)
        TRC20Mock("MulticallToken", "BCT", msg.sender, initialBalance)
    {}
}
