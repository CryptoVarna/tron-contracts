const { BN, constants, expectEvent, expectRevert, createContract, account } = require("@cryptovarna/tron-test-helpers");
const { expect } = require("chai");
const { ZERO_ADDRESS_ETH, MAX_UINT256 } = constants;

const { shouldBehaveLikeTRC20 } = require("../TRC20.behavior");

const TRC20Mock = artifacts.require("TRC20Mock");
const TRC20WrapperMock = artifacts.require("TRC20WrapperMock");

contract("TRC20", function (accounts) {
    const [initialHolder, recipient, anotherAccount] = accounts;

    const name = "My Token";
    const symbol = "MTKN";

    const initialSupply = new BN(100);

    beforeEach(async function () {
        this.underlying = await createContract(TRC20Mock, name, symbol, initialHolder, initialSupply.toFixed());
        this.token = await createContract(TRC20WrapperMock, this.underlying.address, `Wrapped ${name}`, `W${symbol}`);
    });

    afterEach(async function () {
        const balance = BN(await this.underlying.balanceOf(this.token.address).call());
        const totalSupply = BN(await this.token.totalSupply().call());
        expect(balance)
            .to.be.bignumber.equal(totalSupply);
    });

    it("has a name", async function () {
        expect(await this.token.name().call()).to.equal(`Wrapped ${name}`);
    });

    it("has a symbol", async function () {
        expect(await this.token.symbol().call()).to.equal(`W${symbol}`);
    });

    it("has 6 decimals", async function () {
        expect(await this.token.decimals().call()).to.be.bignumber.equal("6");
    });

    it("has underlying", async function () {
        expect(await this.token.underlying().call()).to.equal(this.underlying.address);
    });

    describe("deposit", function () {
        it("valid", async function () {
            account.setDefault(initialHolder);
            await this.underlying.approve(this.token.address, initialSupply.toFixed()).send();
            const txId = await this.token.depositFor(initialHolder, initialSupply.toFixed()).send();

            await expectEvent.inTransaction(txId, this.underlying, "Transfer", {
                from: account.toHexAddress(initialHolder, true),
                to: account.toHexAddress(this.token.address, true),
                value: initialSupply,
            });
            await expectEvent.inTransaction(txId, this.token, "Transfer", {
                from: ZERO_ADDRESS_ETH,
                to: account.toHexAddress(initialHolder, true),
                value: initialSupply,
            });
        });

        it("missing approval", async function () {
            account.setDefault(initialHolder);
            await expectRevert(
                this.token.depositFor(initialHolder, initialSupply.toFixed()).send(),
                "TRC20: transfer amount exceeds allowance",
            );
        });

        it("missing balance", async function () {
            account.setDefault(initialHolder);
            await this.underlying.approve(this.token.address, MAX_UINT256.toFixed()).send();
            await expectRevert(
                this.token.depositFor(initialHolder, MAX_UINT256.toFixed()).send(),
                "TRC20: transfer amount exceeds balance",
            );
        });

        it("to other account", async function () {
            account.setDefault(initialHolder);
            await this.underlying.approve(this.token.address, initialSupply.toFixed()).send();
            const txId = await this.token.depositFor(anotherAccount, initialSupply.toFixed()).send();
            await expectEvent.inTransaction(txId, this.underlying, "Transfer", {
                from: account.toHexAddress(initialHolder, true),
                to: account.toHexAddress(this.token.address, true),
                value: initialSupply,
            });
            await expectEvent.inTransaction(txId, this.token, "Transfer", {
                from: ZERO_ADDRESS_ETH,
                to: account.toHexAddress(anotherAccount, true),
                value: initialSupply,
            });
        });
    });

    describe("withdraw", function () {
        beforeEach(async function () {
            account.setDefault(initialHolder);
            await this.underlying.approve(this.token.address, initialSupply.toFixed()).send();
            await this.token.depositFor(initialHolder, initialSupply.toFixed()).send();
        });

        it("missing balance", async function () {
            account.setDefault(initialHolder);
            await expectRevert(
                this.token.withdrawTo(initialHolder, MAX_UINT256.toFixed()).send(),
                "TRC20: burn amount exceeds balance",
            );
        });

        it("valid", async function () {
            const value = new BN(42);

            account.setDefault(initialHolder);
            const txId = await this.token.withdrawTo(initialHolder, value.toFixed()).send();
            await expectEvent.inTransaction(txId, this.underlying, "Transfer", {
                from: account.toHexAddress(this.token.address, true),
                to: account.toHexAddress(initialHolder, true),
                value: value,
            });
            await expectEvent.inTransaction(txId, this.token, "Transfer", {
                from: account.toHexAddress(initialHolder, true),
                to: ZERO_ADDRESS_ETH,
                value: value,
            });
        });

        it("entire balance", async function () {
            account.setDefault(initialHolder);
            const txId = await this.token.withdrawTo(initialHolder, initialSupply.toFixed()).send();
            await expectEvent.inTransaction(txId, this.underlying, "Transfer", {
                from: account.toHexAddress(this.token.address, true),
                to: account.toHexAddress(initialHolder, true),
                value: initialSupply,
            });
            await expectEvent.inTransaction(txId, this.token, "Transfer", {
                from: account.toHexAddress(initialHolder, true),
                to: ZERO_ADDRESS_ETH,
                value: initialSupply,
            });
        });

        it("to other account", async function () {
            account.setDefault(initialHolder);
            const txId = await this.token.withdrawTo(anotherAccount, initialSupply.toFixed()).send();
            await expectEvent.inTransaction(txId, this.underlying, "Transfer", {
                from: account.toHexAddress(this.token.address, true),
                to: account.toHexAddress(anotherAccount, true),
                value: initialSupply,
            });
            await expectEvent.inTransaction(txId, this.token, "Transfer", {
                from: account.toHexAddress(initialHolder, true),
                to: ZERO_ADDRESS_ETH,
                value: initialSupply,
            });
        });
    });

    describe("recover", function () {
        it("nothing to recover", async function () {
            account.setDefault(initialHolder);
            await this.underlying.approve(this.token.address, initialSupply.toFixed()).send();
            await this.token.depositFor(initialHolder, initialSupply.toFixed()).send();

            const txId = await this.token.recover(anotherAccount).send();
            await expectEvent.inTransaction(txId, this.token, "Transfer", {
                from: ZERO_ADDRESS_ETH,
                to: account.toHexAddress(anotherAccount, true),
                value: "0",
            });
        });

        it("something to recover", async function () {
            account.setDefault(initialHolder);
            await this.underlying.transfer(this.token.address, initialSupply.toFixed()).send();

            const txId = await this.token.recover(anotherAccount).send();
            await expectEvent.inTransaction(txId, this.token, "Transfer", {
                from: ZERO_ADDRESS_ETH,
                to: account.toHexAddress(anotherAccount, true),
                value: initialSupply,
            });
        });
    });

    describe("TRC20 behaviour", function () {
        beforeEach(async function () {
            account.setDefault(initialHolder);
            await this.underlying.approve(this.token.address, initialSupply.toFixed()).send();
            await this.token.depositFor(initialHolder, initialSupply.toFixed()).send();
        });

        shouldBehaveLikeTRC20("TRC20", initialSupply, initialHolder, recipient, anotherAccount);
    });
});
