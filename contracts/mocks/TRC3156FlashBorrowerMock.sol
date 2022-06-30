// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/TRC20/ITRC20.sol";
import "../interfaces/ITRC3156.sol";
import "../utils/Address.sol";

/**
 * @dev WARNING: this ITRC3156FlashBorrower mock implementation is for testing purposes ONLY.
 * Writing a secure flash lock borrower is not an easy task, and should be done with the utmost care.
 * This is not an example of how it should be done, and no pattern present in this mock should be considered secure.
 * Following best practices, always have your contract properly audited before using them to manipulate important funds on
 * live networks.
 */
contract TRC3156FlashBorrowerMock is ITRC3156FlashBorrower {
    bytes32 internal constant _RETURN_VALUE =
        keccak256("TRC3156FlashBorrower.onFlashLoan");

    bool immutable _enableApprove;
    bool immutable _enableReturn;

    event BalanceOf(address token, address account, uint256 value);
    event TotalSupply(address token, uint256 value);

    constructor(bool enableReturn, bool enableApprove) {
        _enableApprove = enableApprove;
        _enableReturn = enableReturn;
    }

    function onFlashLoan(
        address, /*initiator*/
        address token,
        uint256 amount,
        uint256 fee,
        bytes calldata data
    ) public override returns (bytes32) {
        require(msg.sender == token);

        emit BalanceOf(
            token,
            address(this),
            ITRC20(token).balanceOf(address(this))
        );
        emit TotalSupply(token, ITRC20(token).totalSupply());

        if (data.length > 0) {
            // WARNING: This code is for testing purposes only! Do not use.
            Address.functionCall(token, data);
        }

        if (_enableApprove) {
            ITRC20(token).approve(token, amount + fee);
        }

        return _enableReturn ? _RETURN_VALUE : bytes32(0);
    }
}
