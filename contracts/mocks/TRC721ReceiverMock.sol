// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/TRC721/ITRC721Receiver.sol";

contract TRC721ReceiverMock is ITRC721Receiver {
    enum Error {
        None,
        RevertWithMessage,
        RevertWithoutMessage,
        Panic
    }

    bytes4 private immutable _retval;
    Error private immutable _error;

    event Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes data,
        uint256 gas
    );

    event Received(
        address operator,
        address from,
        uint256 tokenId,
        uint256 gas
    );

    constructor(bytes4 retval, Error error) {
        _retval = retval;
        _error = error;
    }

    function onTRC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes memory data
    ) public override returns (bytes4) {
        if (_error == Error.RevertWithMessage) {
            revert("TRC721ReceiverMock: reverting");
        } else if (_error == Error.RevertWithoutMessage) {
            revert();
        } else if (_error == Error.Panic) {
            uint256 a = uint256(0) / uint256(0);
            a;
        }
        if (data.length > 0) {
            emit Received(operator, from, tokenId, data, gasleft());
        } else {
            emit Received(operator, from, tokenId, gasleft());
        }
        return _retval;
    }
}
