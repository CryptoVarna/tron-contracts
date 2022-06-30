// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract TRC165MissingData {
    function supportsInterface(bytes4 interfaceId) public view {} // missing return
}
