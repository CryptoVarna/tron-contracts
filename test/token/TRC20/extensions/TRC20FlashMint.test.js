const { BN, constants, expectEvent, expectRevert, createContract, account, abi } = require("@cryptovarna/tron-test-helpers");
const { expect } = require("chai");
const { MAX_UINT256, ZERO_ADDRESS, ZERO_ADDRESS_ETH } = constants;

const TRC20FlashMintMock = artifacts.require("TRC20FlashMintMock");
const TRC3156FlashBorrowerMock = artifacts.require("TRC3156FlashBorrowerMock");

contract("TRC20FlashMint", function (accounts) {
    const [initialHolder, other] = accounts;

    const name = "My Token";
    const symbol = "MTKN";

    const initialSupply = new BN(100);
    const loanAmount = new BN(10000000000000);

    beforeEach(async function () {
        this.token = await createContract(TRC20FlashMintMock, name, symbol, initialHolder, initialSupply.toFixed());
    });

    describe("maxFlashLoan", function () {
        it("token match", async function () {
            expect(await this.token.maxFlashLoan(this.token.address).call()).to.be.bignumber.equal(MAX_UINT256.minus(initialSupply));
        });

        it("token mismatch", async function () {
            expect(await this.token.maxFlashLoan(ZERO_ADDRESS).call()).to.be.bignumber.equal("0");
        });
    });

    describe("flashFee", function () {
        it("token match", async function () {
            expect(await this.token.flashFee(this.token.address, loanAmount.toFixed()).call()).to.be.bignumber.equal("0");
        });

        it("token mismatch", async function () {
            await expectRevert(this.token.flashFeeMock(ZERO_ADDRESS, loanAmount.toFixed()).send(), "TRC20FlashMint: wrong token");
        });
    });

    describe("flashLoan", function () {
        it("success", async function () {
            const receiver = await createContract(TRC3156FlashBorrowerMock, true, true);
            const txId = await this.token.flashLoan(receiver.address, this.token.address, loanAmount.toFixed(), "0x").send();

            await expectEvent.inTransaction(txId, this.token, "Transfer",
                {
                    from: ZERO_ADDRESS_ETH,
                    to: account.toHexAddress(receiver.address, true),
                    value: loanAmount,
                });
            await expectEvent.inTransaction(txId, this.token, "Transfer",
                {
                    from: account.toHexAddress(receiver.address, true),
                    to: ZERO_ADDRESS_ETH,
                    value: loanAmount,
                });
            await expectEvent.inTransaction(txId, receiver, "BalanceOf",
                {
                    token: account.toHexAddress(this.token.address, true),
                    account: account.toHexAddress(receiver.address, true),
                    value: loanAmount,
                });
            await expectEvent.inTransaction(txId, receiver, "TotalSupply",
                {
                    token: account.toHexAddress(this.token.address, true),
                    value: initialSupply.plus(loanAmount),
                });

            expect(await this.token.totalSupply().call()).to.be.bignumber.equal(initialSupply);
            expect(await this.token.balanceOf(receiver.address).call()).to.be.bignumber.equal("0");
            expect(await this.token.allowance(receiver.address, this.token.address).call()).to.be.bignumber.equal("0");
        });

        it("missing return value", async function () {
            const receiver = await createContract(TRC3156FlashBorrowerMock, false, true);
            await expectRevert(
                this.token.flashLoan(receiver.address, this.token.address, loanAmount.toFixed(), "0x").send(),
                "TRC20FlashMint: invalid return value",
            );
        });

        it("missing approval", async function () {
            const receiver = await createContract(TRC3156FlashBorrowerMock, true, false);
            await expectRevert(
                this.token.flashLoan(receiver.address, this.token.address, loanAmount.toFixed(), "0x").send(),
                "TRC20FlashMint: allowance does not allow refund",
            );
        });

        it("unavailable funds", async function () {
            const receiver = await createContract(TRC3156FlashBorrowerMock, true, true);
            const data = abi.encodeFunctionCall(this.token, "transfer", account.toHexAddress(other, true), 10);
            await expectRevert(
                this.token.flashLoan(receiver.address, this.token.address, loanAmount.toFixed(), data).send(),
                "TRC20: burn amount exceeds balance",
            );
        });

        it("more than maxFlashLoan", async function () {
            const receiver = await createContract(TRC3156FlashBorrowerMock, true, true);
            const data = abi.encodeFunctionCall(this.token, "transfer", account.toHexAddress(other, true), 10);
            // _mint overflow reverts using a panic code. No reason string.
            await expectRevert.assertion(this.token.flashLoan(receiver.address, this.token.address, MAX_UINT256.toFixed(), data).send());
        });
    });
});
