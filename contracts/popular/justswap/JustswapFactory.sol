// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "./JustswapExchange.sol";

contract JustswapFactory {
    event NewExchange(address indexed token, address indexed exchange);

    address public exchangeTemplate = address(0);
    uint256 public tokenCount = 0;
    mapping(address => address) private token_to_exchange;
    mapping(address => address) private exchange_to_token;
    mapping(uint256 => address) private id_to_token;

    function initializeFactory(address template) external {
        require(exchangeTemplate == address(0), "exchangeTemplate already set");
        require(template != address(0), "illegal template");
        exchangeTemplate = template;
    }

    function createExchange(address token) external returns (address payable) {
        require(token != address(0), "illegal token");
        require(exchangeTemplate != address(0), "exchangeTemplate not set");
        require(
            token_to_exchange[token] == address(0),
            "exchange already created"
        );

        JustswapExchange exchange = new JustswapExchange();
        exchange.setup(token, address(this));
        token_to_exchange[token] = address(exchange);
        exchange_to_token[address(exchange)] = token;
        uint256 token_id = tokenCount + 1;
        tokenCount = token_id;
        id_to_token[token_id] = token;
        emit NewExchange(token, address(exchange));

        return payable(exchange);
    }

    function getExchange(address token)
        external
        view
        returns (address payable)
    {
        return payable(token_to_exchange[token]);
    }

    function setExchange(address token, address exchange) external payable {
        token_to_exchange[token] = address(exchange);
        exchange_to_token[address(exchange)] = token;
        uint256 token_id = tokenCount + 1;
        tokenCount = token_id;
        id_to_token[token_id] = token;
        emit NewExchange(token, address(exchange));
    }

    /**
        @param token Wrong naming - should be "exchange"
     */
    function getToken(address token) external view returns (address) {
        return exchange_to_token[token];
    }

    function getTokenWihId(uint256 token_id) external view returns (address) {
        return id_to_token[token_id];
    }

}
