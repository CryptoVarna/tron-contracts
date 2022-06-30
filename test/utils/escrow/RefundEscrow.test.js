const { balance, constants, trx, expectEvent, expectRevert, account, createContract } =
    require("@cryptovarna/tron-test-helpers");
const { ZERO_ADDRESS } = constants;

const { expect } = require("chai");

const RefundEscrow = artifacts.require("RefundEscrow");
const RefundEscrowFail = artifacts.require("RefundEscrowFailMock");

contract("RefundEscrow", function (accounts) {
    const [owner, beneficiary, refundee1, refundee2] = accounts;

    const amount = trx("54");
    const refundees = [refundee1, refundee2];

    it("requires a non-null beneficiary", async function () {
        account.setDefault(owner);
        const contract = await createContract(RefundEscrowFail);
        await expectRevert(
            contract.initialize(ZERO_ADDRESS).send(),
            "RefundEscrow: beneficiary is the zero address",
        );
    });

    context("once deployed", function () {
        beforeEach(async function () {
            account.setDefault(owner);
            this.escrow = await createContract(RefundEscrow, beneficiary);
        });

        context("active state", function () {
            it("has beneficiary and state", async function () {
                expect(await this.escrow.beneficiary().call()).to.equal(account.toHexAddress(beneficiary));
                expect(await this.escrow.state().call()).to.be.bignumber.equal("0");
            });

            it("accepts deposits", async function () {
                account.setDefault(owner);
                await this.escrow.deposit(refundee1).send({ callValue: amount, shouldPollResponse: true });

                expect(await this.escrow.depositsOf(refundee1).call()).to.be.bignumber.equal(amount);
            });

            it("does not refund refundees", async function () {
                account.setDefault(owner);
                await this.escrow.deposit(refundee1).send({ callValue: amount, shouldPollResponse: true });
                await expectRevert(this.escrow.withdraw(refundee1).send(),
                    "ConditionalEscrow: payee is not allowed to withdraw",
                );
            });

            it("does not allow beneficiary withdrawal", async function () {
                account.setDefault(owner);
                await this.escrow.deposit(refundee1).send({ callValue: amount, shouldPollResponse: true });
                await expectRevert(this.escrow.beneficiaryWithdraw().send(),
                    "RefundEscrow: beneficiary can only withdraw while closed",
                );
            });
        });

        it("only the owner can enter closed state", async function () {
            account.setDefault(beneficiary);
            await expectRevert(this.escrow.close().send(),
                "Ownable: caller is not the owner",
            );

            account.setDefault(owner);
            const txId = await this.escrow.close().send();
            await expectEvent.inTransaction(txId, this.escrow, "RefundsClosed");
        });

        context("closed state", function () {
            beforeEach(async function () {
                account.setDefault(owner);
                await Promise.all(refundees.map(refundee =>
                    this.escrow.deposit(refundee).send({ callValue: amount, shouldPollResponse: true })));

                txId = await this.escrow.close().send();
            });

            it("rejects deposits", async function () {
                account.setDefault(owner);
                await expectRevert(this.escrow.deposit(refundee1).send({ callValue: amount }),
                    "RefundEscrow: can only deposit while active",
                );
            });

            it("does not refund refundees", async function () {
                await expectRevert(this.escrow.withdraw(refundee1).send(),
                    "ConditionalEscrow: payee is not allowed to withdraw",
                );
            });

            it("allows beneficiary withdrawal", async function () {
                const balanceTracker = await balance.tracker(beneficiary);
                await this.escrow.beneficiaryWithdraw().send({ shouldPollResponse: true });
                expect(await balanceTracker.delta()).to.be.bignumber.equal(amount.times(refundees.length));
            });

            it("prevents entering the refund state", async function () {
                account.setDefault(owner);
                await expectRevert(this.escrow.enableRefunds().send(),
                    "RefundEscrow: can only enable refunds while active",
                );
            });

            it("prevents re-entering the closed state", async function () {
                account.setDefault(owner);
                await expectRevert(this.escrow.close().send(),
                    "RefundEscrow: can only close while active",
                );
            });
        });

        it("only the owner can enter refund state", async function () {
            account.setDefault(beneficiary);
            await expectRevert(this.escrow.enableRefunds().send(),
                "Ownable: caller is not the owner",
            );

            account.setDefault(owner);
            const txId = await this.escrow.enableRefunds().send();
            await expectEvent.inTransaction(txId, this.escrow, "RefundsEnabled");
        });

        context("refund state", function () {
            beforeEach(async function () {
                account.setDefault(owner);
                await Promise.all(refundees.map(refundee =>
                    this.escrow.deposit(refundee).send({ callValue: amount, shouldPollResponse: true })));

                await this.escrow.enableRefunds().send();
            });

            it("rejects deposits", async function () {
                account.setDefault(owner);
                await expectRevert(this.escrow.deposit(refundee1).send({ callValue: amount }),
                    "RefundEscrow: can only deposit while active",
                );
            });

            it("refunds refundees", async function () {
                account.setDefault(owner);
                for (const refundee of [refundee1, refundee2]) {
                    const balanceTracker = await balance.tracker(refundee);
                    await this.escrow.withdraw(refundee).send({ shouldPollResponse: true });
                    expect(await balanceTracker.delta()).to.be.bignumber.equal(amount);
                }
            });

            it("does not allow beneficiary withdrawal", async function () {
                await expectRevert(this.escrow.beneficiaryWithdraw().send(),
                    "RefundEscrow: beneficiary can only withdraw while closed",
                );
            });

            it("prevents entering the closed state", async function () {
                account.setDefault(owner);
                await expectRevert(this.escrow.close().send(),
                    "RefundEscrow: can only close while active",
                );
            });

            it("prevents re-entering the refund state", async function () {
                account.setDefault(owner);
                await expectRevert(this.escrow.enableRefunds().send(),
                    "RefundEscrow: can only enable refunds while active",
                );
            });
        });
    });
});
