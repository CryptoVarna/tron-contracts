// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/escrow/RefundEscrow.sol";

// mock class using PullPayment
contract RefundEscrowFailMock {
    RefundEscrow private _refundEscrow;

    function initialize(address payable beneficiary_) public payable {
        _refundEscrow = new RefundEscrow(beneficiary_);
    }
}
