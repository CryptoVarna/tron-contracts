// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/cryptography/ECDSA.sol";

contract ECDSAMock {
    using ECDSA for bytes32;

    function recover(bytes32 hash, bytes memory signature)
        public
        returns (address)
    {
        return hash.recover(signature);
    }

    function toTronSignedMessageHash(bytes32 hash) public returns (bytes32) {
        return hash.toTronSignedMessageHash();
    }
}
