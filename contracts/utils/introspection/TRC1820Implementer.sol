// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ITRC1820Implementer.sol";

/**
 * @dev Implementation of the {ITRC1820Implementer} interface.
 *
 * Contracts may inherit from this and call {_registerInterfaceForAddress} to
 * declare their willingness to be implementers.
 * {ITRC1820Registry-setInterfaceImplementer} should then be called for the
 * registration to be complete.
 */
contract TRC1820Implementer is ITRC1820Implementer {
    bytes32 private constant _TRC1820_ACCEPT_MAGIC =
        keccak256("TRC1820_ACCEPT_MAGIC");

    mapping(bytes32 => mapping(address => bool)) private _supportedInterfaces;

    /**
     * @dev See {ITRC1820Implementer-canImplementInterfaceForAddress}.
     */
    function canImplementInterfaceForAddress(
        bytes32 interfaceHash,
        address account
    ) public view virtual override returns (bytes32) {
        return
            _supportedInterfaces[interfaceHash][account]
                ? _TRC1820_ACCEPT_MAGIC
                : bytes32(0x00);
    }

    /**
     * @dev Declares the contract as willing to be an implementer of
     * `interfaceHash` for `account`.
     *
     * See {ITRC1820Registry-setInterfaceImplementer} and
     * {ITRC1820Registry-interfaceHash}.
     */
    function _registerInterfaceForAddress(
        bytes32 interfaceHash,
        address account
    ) internal virtual {
        _supportedInterfaces[interfaceHash][account] = true;
    }
}
