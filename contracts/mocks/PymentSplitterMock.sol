// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../finance/PaymentSplitter.sol";

contract PaymentSplitterMock {
    PaymentSplitter private _paymentSplitter;

    function initialize(address[] memory payees, uint256[] memory shares_)
        public
        payable
    {
        _paymentSplitter = new PaymentSplitter(payees, shares_);
    }
}
