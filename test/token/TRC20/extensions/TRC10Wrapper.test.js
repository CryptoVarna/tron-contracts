const { BN, constants, expectEvent, expectRevert, createContract, account, createToken, assertFailure, send } =
    require("@cryptovarna/tron-test-helpers");
const { expect } = require("chai");
const { ZERO_ADDRESS_ETH, MAX_UINT256 } = constants;

const { shouldBehaveLikeTRC20 } = require("../TRC20.behavior");

// const TRC20Mock = artifacts.require("TRC20Mock");
const TRC10WrapperMock = artifacts.require("TRC10WrapperMock");

contract("TRC10", function (accounts) {
    const [initialHolder, recipient, anotherAccount] = accounts;

    const name = "MyToken";
    const symbol = "MTKN";

    const initialSupply = new BN(100000);

    before(async function () {
        this.underlying = await createToken(initialHolder, name, initialSupply.toFixed(), symbol);
    });

    beforeEach(async function () {
        this.token = await createContract(TRC10WrapperMock, this.underlying, `Wrapped ${name}`, `W${symbol}`);
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
        expect(await this.token.underlying().call()).to.be.bignumber.equal(this.underlying);
    });

    describe("deposit", function () {
        it("valid", async function () {
            const value = new BN(1);
            account.setDefault(initialHolder);
            const txId = await this.token.depositFor(initialHolder)
                .send({ tokenId: this.underlying, tokenValue: value.toFixed() });

            await expectEvent.inTransaction(txId, this.token, "Transfer", {
                from: ZERO_ADDRESS_ETH,
                to: account.toHexAddress(initialHolder, true),
                value: value.toFixed(),
            });
        });

        it("zero token amount", async function () {
            account.setDefault(initialHolder);
            await expectRevert(
                this.token.depositFor(initialHolder).send({ tokenId: this.underlying, tokenValue: 0 }),
                "TRC10Wrapper: No tokens sent",
            );
        });

        it("missing balance", async function () {
            account.setDefault(initialHolder);
            await assertFailure(this.token.depositFor(initialHolder)
                .send({ tokenId: this.underlying, tokenValue: initialSupply.times(2).toNumber() }));
        });

        it("to other account", async function () {
            const value = new BN(1);
            account.setDefault(initialHolder);
            const txId = await this.token.depositFor(anotherAccount)
                .send({ tokenId: this.underlying, tokenValue: value.toFixed() });
            await expectEvent.inTransaction(txId, this.token, "Transfer", {
                from: ZERO_ADDRESS_ETH,
                to: account.toHexAddress(anotherAccount, true),
                value: value.toFixed(),
            });
        });
    });

    describe("withdraw", function () {
        beforeEach(async function () {
            const value = new BN(10);
            account.setDefault(initialHolder);
            await this.token.depositFor(initialHolder).send({ tokenId: this.underlying, tokenValue: value.toFixed() });
        });

        it("missing balance", async function () {
            account.setDefault(initialHolder);
            await expectRevert(
                this.token.withdrawTo(initialHolder, MAX_UINT256.toFixed()).send(),
                "TRC20: burn amount exceeds balance",
            );
        });

        it("valid", async function () {
            const value = new BN(10);

            account.setDefault(initialHolder);
            const txId = await this.token.withdrawTo(initialHolder, value.toFixed()).send();

            await expectEvent.inTransaction(txId, this.token, "Transfer", {
                from: account.toHexAddress(initialHolder, true),
                to: ZERO_ADDRESS_ETH,
                value: value.toFixed(),
            });
        });

        it("entire balance", async function () {
            const value = new BN(10);
            account.setDefault(initialHolder);
            await this.token.depositFor(initialHolder).send({ tokenId: this.underlying, tokenValue: value.toFixed() });
            const totalBalance = BN(await this.token.balanceOf(initialHolder).call());
            const txId = await this.token.withdrawTo(initialHolder, totalBalance.toFixed()).send();

            await expectEvent.inTransaction(txId, this.token, "Transfer", {
                from: account.toHexAddress(initialHolder, true),
                to: ZERO_ADDRESS_ETH,
                value: totalBalance.toFixed(),
            });
        });

        it("to other account", async function () {
            const value = new BN(1);
            account.setDefault(initialHolder);
            const txId = await this.token.withdrawTo(anotherAccount, value.toFixed()).send();

            await expectEvent.inTransaction(txId, this.token, "Transfer", {
                from: account.toHexAddress(initialHolder, true),
                to: ZERO_ADDRESS_ETH,
                value: value.toFixed(),
            });
        });
    });

    describe("recover", function () {
        it("nothing to recover", async function () {
            const value = new BN(10);
            account.setDefault(initialHolder);
            await this.token.depositFor(initialHolder)
                .send({ tokenId: this.underlying, tokenValue: value.toFixed() });

            const txId = await this.token.recover(anotherAccount).send();
            await expectEvent.inTransaction(txId, this.token, "Transfer", {
                from: ZERO_ADDRESS_ETH,
                to: account.toHexAddress(anotherAccount, true),
                value: "0",
            });
        });

        it("something to recover", async function () {
            const value = new BN(10);
            account.setDefault(initialHolder);
            await send.token(this.token.address, value.toFixed(), this.underlying, true);

            const txId = await this.token.recover(anotherAccount).send();
            await expectEvent.inTransaction(txId, this.token, "Transfer", {
                from: ZERO_ADDRESS_ETH,
                to: account.toHexAddress(anotherAccount, true),
                value: value.toFixed(),
            });
        });
    });

    describe("TRC20 behaviour", function () {

        beforeEach(async function () {
            account.setDefault(initialHolder);
            await this.token.depositFor(initialHolder).send({ tokenId: this.underlying, tokenValue: "100" });
        });

        shouldBehaveLikeTRC20("TRC20", new BN(100), initialHolder, recipient, anotherAccount);
    });
});
