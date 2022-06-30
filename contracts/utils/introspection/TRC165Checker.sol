// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ITRC165.sol";

/**
 * @dev Library used to query support of an interface declared via {ITRC165}.
 *
 * Note that these functions return the actual result of the query: they do not
 * `revert` if an interface is not supported. It is up to the caller to decide
 * what to do in these cases.
 */
library TRC165Checker {
    // As per the EIP-165 spec, no interface should ever match 0xffffffff
    bytes4 private constant _INTERFACE_ID_INVALID = 0xffffffff;

    /**
     * @dev Returns true if `account` supports the {ITRC165} interface,
     */
    function supportsTRC165(address account) internal view returns (bool) {
        // Any contract that implements TRC165 must explicitly indicate support of
        // InterfaceId_TRC165 and explicitly indicate non-support of InterfaceId_Invalid
        return
            _supportsTRC165Interface(account, type(ITRC165).interfaceId) &&
            !_supportsTRC165Interface(account, _INTERFACE_ID_INVALID);
    }

    /**
     * @dev Returns true if `account` supports the interface defined by
     * `interfaceId`. Support for {ITRC165} itself is queried automatically.
     *
     * See {ITRC165-supportsInterface}.
     */
    function supportsInterface(address account, bytes4 interfaceId)
        internal
        view
        returns (bool)
    {
        // query support of both TRC165 as per the spec and support of _interfaceId
        return
            supportsTRC165(account) &&
            _supportsTRC165Interface(account, interfaceId);
    }

    /**
     * @dev Returns a boolean array where each value corresponds to the
     * interfaces passed in and whether they're supported or not. This allows
     * you to batch check interfaces for a contract where your expectation
     * is that some interfaces may not be supported.
     *
     * See {ITRC165-supportsInterface}.
     *
     * _Available since v3.4._
     */
    function getSupportedInterfaces(
        address account,
        bytes4[] memory interfaceIds
    ) internal view returns (bool[] memory) {
        // an array of booleans corresponding to interfaceIds and whether they're supported or not
        bool[] memory interfaceIdsSupported = new bool[](interfaceIds.length);

        // query support of TRC165 itself
        if (supportsTRC165(account)) {
            // query support of each interface in interfaceIds
            for (uint256 i = 0; i < interfaceIds.length; i++) {
                interfaceIdsSupported[i] = _supportsTRC165Interface(
                    account,
                    interfaceIds[i]
                );
            }
        }

        return interfaceIdsSupported;
    }

    /**
     * @dev Returns true if `account` supports all the interfaces defined in
     * `interfaceIds`. Support for {ITRC165} itself is queried automatically.
     *
     * Batch-querying can lead to gas savings by skipping repeated checks for
     * {ITRC165} support.
     *
     * See {ITRC165-supportsInterface}.
     */
    function supportsAllInterfaces(
        address account,
        bytes4[] memory interfaceIds
    ) internal view returns (bool) {
        // query support of TRC165 itself
        if (!supportsTRC165(account)) {
            return false;
        }

        // query support of each interface in _interfaceIds
        for (uint256 i = 0; i < interfaceIds.length; i++) {
            if (!_supportsTRC165Interface(account, interfaceIds[i])) {
                return false;
            }
        }

        // all interfaces supported
        return true;
    }

    /**
     * @notice Query if a contract implements an interface, does not check TRC165 support
     * @param account The address of the contract to query for support of an interface
     * @param interfaceId The interface identifier, as specified in ERC-165
     * @return true if the contract at account indicates support of the interface with
     * identifier interfaceId, false otherwise
     * @dev Assumes that account contains a contract that supports TRC165, otherwise
     * the behavior of this method is undefined. This precondition can be checked
     * with {supportsTRC165}.
     * Interface identification is specified in ERC-165.
     */
    function _supportsTRC165Interface(address account, bytes4 interfaceId)
        private
        view
        returns (bool)
    {
        bytes memory encodedParams = abi.encodeWithSelector(
            ITRC165.supportsInterface.selector,
            interfaceId
        );
        (bool success, bytes memory result) = account.staticcall{gas: 30000}(
            encodedParams
        );
        if (result.length < 32) return false;
        return success && abi.decode(result, (bool));
    }
}
