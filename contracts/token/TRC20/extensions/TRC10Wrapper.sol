// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../TRC20.sol";

/**
 * @dev Contract for wrapping TRC10 to TRC20 tokens.
 *
 * Users can deposit and withdraw "underlying tokens" and receive a matching number of "wrapped tokens". This is useful
 * in conjunction with other modules. For example, combining this wrapping mechanism with {TRC20Votes} will allow the
 * wrapping of an existing "basic" TRC20 into a governance token.
 *
 * _Available since v4.2._
 */
abstract contract TRC10Wrapper is TRC20 {
    trcToken public immutable underlying;

    constructor(trcToken underlyingToken) {
        require(underlyingToken > 1000000, "TRC10Wrapper: Invalid token");
        underlying = underlyingToken;
    }

    /**
     * @dev Allow a user to deposit underlying (TRC10) tokens and mint the corresponding number of wrapped (TRC20) tokens.
     */
    function depositFor(address account)
        public
        payable
        virtual
        returns (uint256)
    {
        require(msg.tokenid == underlying, "TRC10Wrapper: Wrong token sent");
        require(msg.tokenvalue > 0, "TRC10Wrapper: No tokens sent");
        _mint(account, msg.tokenvalue);
        return msg.tokenvalue;
    }

    /**
     * @dev Allow a user to burn a number of wrapped tokens and withdraw the corresponding number of underlying tokens.
     */
    function withdrawTo(address payable account, uint256 amount)
        public
        virtual
        returns (bool)
    {
        _burn(_msgSender(), amount);
        account.transferToken(amount, underlying);
        return true;
    }

    /**
     * @dev Mint wrapped token to cover any underlyingTokens that would have been transfered by mistake. Internal
     * function that can be exposed with access control if desired.
     */
    function _recover(address account) internal virtual returns (uint256) {
        uint256 value = address(this).tokenBalance(underlying) - totalSupply();
        _mint(account, value);
        return value;
    }
}
