// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../Governor.sol";
import "../../token/TRC20/extensions/TRC20Votes.sol";
import "../../utils/math/Math.sol";

/**
 * @dev Extension of {Governor} for voting weight extraction from an {TRC20Votes} token.
 *
 * _Available since v4.3._
 */
abstract contract GovernorVotes is Governor {
    TRC20Votes public immutable token;

    constructor(TRC20Votes tokenAddress) {
        token = tokenAddress;
    }

    /**
     * Read the voting weight from the token's built in snapshot mechanism (see {IGovernor-getVotes}).
     */
    function getVotes(address account, uint256 blockNumber)
        public
        view
        virtual
        override
        returns (uint256)
    {
        return token.getPastVotes(account, blockNumber);
    }
}
