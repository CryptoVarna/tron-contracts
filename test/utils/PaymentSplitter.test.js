const { account, balance, constants, trx, expectEvent, send, expectRevert, createContract } =
    require("@cryptovarna/tron-test-helpers");
const { ZERO_ADDRESS } = constants;

const { expect } = require("chai");

const PaymentSplitterMock = artifacts.require("PaymentSplitterMock");
const PaymentSplitter = artifacts.require("PaymentSplitter");

contract("PaymentSplitter", function (accounts) {
    const [owner, payee1, payee2, payee3, nonpayee1, payer1] = accounts;

    const amount = trx("1");

    beforeEach(async function () {
        this.paymentSplitterMock = await createContract(PaymentSplitterMock);
    });

    it("rejects an empty set of payees", async function () {
        await expectRevert(this.paymentSplitterMock.initialize([], []).send(), "PaymentSplitter: no payees");
    });

    it("rejects more payees than shares", async function () {
        await expectRevert(this.paymentSplitterMock.initialize([payee1, payee2, payee3], [20, 30]).send(),
            "PaymentSplitter: payees and shares length mismatch",
        );
    });

    it("rejects more shares than payees", async function () {
        await expectRevert(this.paymentSplitterMock.initialize([payee1, payee2], [20, 30, 40]).send(),
            "PaymentSplitter: payees and shares length mismatch",
        );
    });

    it("rejects null payees", async function () {
        await expectRevert(this.paymentSplitterMock.initialize([payee1, ZERO_ADDRESS], [20, 30]).send(),
            "PaymentSplitter: account is the zero address",
        );
    });

    it("rejects zero-valued shares", async function () {
        await expectRevert(this.paymentSplitterMock.initialize([payee1, payee2], [20, 0]).send(),
            "PaymentSplitter: shares are 0",
        );
    });

    it("rejects repeated payees", async function () {
        await expectRevert(this.paymentSplitterMock.initialize([payee1, payee1], [20, 30]).send(),
            "PaymentSplitter: account already has shares",
        );
    });

    context("once deployed", function () {
        beforeEach(async function () {
            this.payees = [payee1, payee2, payee3];
            this.shares = [20, 10, 70];

            this.paymentSplitter = await createContract(PaymentSplitter, this.payees, this.shares);
        });

        it("has total shares", async function () {
            expect(await this.paymentSplitter.totalShares().call()).to.be.bignumber.equal("100");
        });

        it("has payees", async function () {
            await Promise.all(this.payees.map(async (payee, index) => {
                expect(await this.paymentSplitter.payee(index).call()).to.equal(account.toHexAddress(payee));
                expect(await this.paymentSplitter.released(payee).call()).to.be.bignumber.equal("0");
            }));
        });

        it("accepts payments", async function () {
            account.setDefault(owner);
            await send.trx(this.paymentSplitter.address, amount);
            expect(await balance.current(this.paymentSplitter.address)).to.be.bignumber.equal(amount);
        });

        describe("shares", async function () {
            it("stores shares if address is payee", async function () {
                expect(await this.paymentSplitter.shares(payee1).call()).to.be.bignumber.not.equal("0");
            });

            it("does not store shares if address is not payee", async function () {
                expect(await this.paymentSplitter.shares(nonpayee1).call()).to.be.bignumber.equal("0");
            });
        });

        describe("release", async function () {
            it("reverts if no funds to claim", async function () {
                await expectRevert(this.paymentSplitter.release(payee1).send(),
                    "PaymentSplitter: account is not due payment",
                );
            });
            it("reverts if non-payee want to claim", async function () {
                account.setDefault(payer1);
                await send.trx(this.paymentSplitter.address, amount);
                await expectRevert(this.paymentSplitter.release(nonpayee1).send(),
                    "PaymentSplitter: account has no shares",
                );
            });
        });

        it("distributes funds to payees", async function () {
            account.setDefault(payer1);
            await send.trx(this.paymentSplitter.address, amount);

            // receive funds
            const initBalance = await balance.current(this.paymentSplitter.address);
            expect(initBalance).to.be.bignumber.equal(amount);

            // distribute to payees
            // removed {gasPrice: 0} from function parameters
            const initAmount1 = await balance.current(payee1);
            const tx1 = await this.paymentSplitter.release(payee1).send(
                {
                    shouldPollResponse: true,
                    rawResponse: true,
                });
            const profit1 = (await balance.current(payee1)).minus(initAmount1);
            expect(profit1).to.be.bignumber.equal(trx("0.20"));
            await expectEvent.inTransaction(tx1.id, this.paymentSplitter, "PaymentReleased",
                {
                    to: account.toHexAddress(payee1, true),
                    amount: profit1,
                });

            const initAmount2 = await balance.current(payee2);
            const tx2 = await this.paymentSplitter.release(payee2).send(
                {
                    shouldPollResponse: true,
                    rawResponse: true,
                });
            const profit2 = (await balance.current(payee2)).minus(initAmount2);
            expect(profit2).to.be.bignumber.equal(trx("0.10"));
            await expectEvent.inTransaction(tx2.id, this.paymentSplitter, "PaymentReleased",
                {
                    to: account.toHexAddress(payee2, true),
                    amount: profit2,
                });

            const initAmount3 = await balance.current(payee3);
            const tx3 = await this.paymentSplitter.release(payee3).send(
                {
                    shouldPollResponse: true,
                    rawResponse: true,
                });
            const profit3 = (await balance.current(payee3)).minus(initAmount3);
            expect(profit3).to.be.bignumber.equal(trx("0.70"));
            await expectEvent.inTransaction(tx3.id, this.paymentSplitter, "PaymentReleased",
                {
                    to: account.toHexAddress(payee3, true),
                    amount: profit3,
                });

            // // end balance should be zero
            expect(await balance.current(await this.paymentSplitter.address)).to.be.bignumber.equal("0");

            // // check correct funds released accounting
            expect(await this.paymentSplitter.totalReleased().call()).to.be.bignumber.equal(initBalance);
        });
    });
});
