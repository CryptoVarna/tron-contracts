// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ContextMock.sol";
import "../metatx/TRC2771Context.sol";

// By inheriting from TRC2771Context, Context's internal functions are overridden automatically
contract TRC2771ContextMock is ContextMock, TRC2771Context {
    constructor(address trustedForwarder) TRC2771Context(trustedForwarder) {}

    function _msgSender()
        internal
        view
        virtual
        override(Context, TRC2771Context)
        returns (address)
    {
        return TRC2771Context._msgSender();
    }

    function _msgData()
        internal
        view
        virtual
        override(Context, TRC2771Context)
        returns (bytes calldata)
    {
        return TRC2771Context._msgData();
    }
}
