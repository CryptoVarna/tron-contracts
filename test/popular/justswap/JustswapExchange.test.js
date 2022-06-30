const { createContract, account, constants, waitConfirmedTransaction, waitUnconfirmedTransaction, expectRevert, trx, wait, BN } = require("@cryptovarna/tron-test-helpers");
const { expect } = require("chai");
const JustswapExchangeInstance = artifacts.require("JustswapExchange");
const JustswapFactoryInstance = artifacts.require("JustswapFactory");
const TRC20Mock = artifacts.require("TRC20Mock");
const TRC20JSMock = artifacts.require("TRC20JSMock");

contract("JustswapExchange", function (accounts) {
    const [owner, accountUser1, accountUser2, exchangeAccount] = accounts;
    const initialSupply = 10e5;

    describe("Exchange Setup", function () {
        beforeEach(async function () {
            account.setDefault(owner);
            this.exchange = await createContract(JustswapExchangeInstance);
            this.factory = await createContract(JustswapFactoryInstance);
        });
        it("should be able to setup", async function () {
            const token = await createContract(TRC20Mock, "MockToken", "MT", exchangeAccount, initialSupply);
            waitConfirmedTransaction(await this.factory.initializeFactory(this.exchange.address).send());

            // Cannot initialize twice
            expectRevert.unspecified(this.factory.initializeFactory(token.address).send());

            expect(await this.factory.exchangeTemplate().call()).is.equal(this.exchange.address);
            expect(await this.factory.getExchange(token.address).call()).is.equal(constants.ZERO_ADDRESS);

            waitConfirmedTransaction(await this.factory.createExchange(token.address).send());
            this.tokenExchangeAddress = await this.factory.getExchange(token.address).call();
            console.log(this.tokenExchangeAddress);
            expect(await this.tokenExchangeAddress).is.not.equal(constants.ZERO_ADDRESS);
        });
    });
    describe("Exchange Interactions", function () {
        it("should be able to add liquidity (contract)", async function () {
            account.setDefault(owner);
            this.exchange = await createContract(JustswapExchangeInstance);
            this.factory = await createContract(JustswapFactoryInstance);
            await this.factory.initializeFactory(owner).send();

            const token = await createContract(TRC20JSMock, owner, initialSupply);
            await waitUnconfirmedTransaction(await this.exchange.setup(token.address, this.factory.address).send());
            await this.factory.setExchange(token.address, this.exchange.address).send();

            await waitUnconfirmedTransaction(await token.approve(this.exchange.address, initialSupply).send());

            const trxAmount = 12;
            const deadline = Date.now() + 25000;
            const supply = initialSupply / 10;

            account.setDefault(owner);
            expect(await this.exchange.addLiquidity(0, 20, deadline).send({ callValue: trx(trxAmount) })).to.equal(new BN(20));

        });
        it("should be able to transfer token to token (withot buying)", async function () {
            account.setDefault(owner);
            // Create tokens and approve the owner balances to be moved by himself
            const token = await createContract(TRC20JSMock, owner, initialSupply);
            await token.approve(owner, initialSupply).send();
            const token2 = await createContract(TRC20JSMock, owner, initialSupply);
            await token2.approve(owner, initialSupply).send();
            console.log("Token One initial supply: " + await token.balanceOf(owner).call());
            console.log("Token Two initial supply: " + await token2.balanceOf(owner).call());

            // Create a factory and initialize it
            const factory = await createContract(JustswapFactoryInstance);
            await factory.initializeFactory(owner).send();

            // Create an exchange and initialize it
            const exchange = await createContract(JustswapExchangeInstance);
            const exchange2 = await createContract(JustswapExchangeInstance);
            await waitUnconfirmedTransaction(await exchange.setup(token.address, factory.address).send());
            await waitUnconfirmedTransaction(await exchange2.setup(token2.address, factory.address).send());
            await factory.setExchange(token.address, exchange.address).send();
            await factory.setExchange(token2.address, exchange2.address).send();

            console.log("Exchange 1 address: " + await factory.getExchange(token.address).call());
            console.log("Exchange 2 address: " + await factory.getExchange(token2.address).call());
            // Approve the "owner" tokens to be moved by the exchanges
            await waitUnconfirmedTransaction(await token.approve(exchange.address, initialSupply).send());
            await waitUnconfirmedTransaction(await token2.approve(exchange2.address, initialSupply).send());

            // Add liquidity to both exchanges
            const trxAmount = 12;
            const deadline = Date.now() + 25000;
            const supply = initialSupply / 2;
            await waitUnconfirmedTransaction(await exchange.addLiquidity(0, supply, deadline).send({ callValue: trx(trxAmount) }));
            await waitUnconfirmedTransaction(await exchange2.addLiquidity(0, supply, deadline).send({ callValue: trx(trxAmount) }));

            // Transfer Token 1 amount to the user account
            const acc1TokenAmmount = initialSupply / 10;
            await token.transferFrom(owner, accountUser1, acc1TokenAmmount).send();
            console.log("Account User 1 has Token 1 balance of: " + await token.balanceOf(accountUser1).call());
            console.log("Account User 1 has Token 2 balance of: " + await token2.balanceOf(accountUser1).call());

            // Approve the Token 1 balance to be moved by exchange 1 and himself
            account.setDefault(accountUser1);
            await token.approve(accountUser1, acc1TokenAmmount).send();
            await token.approve(exchange.address, acc1TokenAmmount).send();
            await token.approve(exchange2.address, acc1TokenAmmount).send();

            console.log("Exchange 2 tokens bought from account user 1: " +
                await exchange.tokenToTokenSwapInput(
                    acc1TokenAmmount,
                    1,
                    1,
                    deadline,
                    token2.address)
                    .send({ shouldPollResponse: true }));

            console.log("Account User 1 has Token 1 balance of: " + await token.balanceOf(accountUser1).call());
            console.log("Account User 1 has Token 2 balance of: " + await token2.balanceOf(accountUser1).call());

        });
    });
});
