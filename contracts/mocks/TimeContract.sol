// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

contract TimeContract {
    uint256 private counter;

    function increment() external {
        counter++;
    }
}
