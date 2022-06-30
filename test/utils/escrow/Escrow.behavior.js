const { balance, trx, expectEvent, expectRevert, account } = require("@cryptovarna/tron-test-helpers");

const { expect } = require("chai");

function shouldBehaveLikeEscrow(owner, [payee1, payee2]) {
    const amount = trx("42");

    describe("as an escrow", function () {
        describe("deposits", function () {
            it("can accept a single deposit", async function () {
                await this.escrow.deposit(payee1).send({ callValue: amount, shouldPollResponse: true });

                expect(await balance.current(this.escrow.address)).to.be.bignumber.equal(amount);

                expect(await this.escrow.depositsOf(payee1).call()).to.be.bignumber.equal(amount);
            });

            it("can accept an empty deposit", async function () {
                await this.escrow.deposit(payee1).send({ callValue: 0 });
            });

            it("only the owner can deposit", async function () {
                account.setDefault(payee2);
                await expectRevert(this.escrow.deposit(payee1).send(),
                    "Ownable: caller is not the owner",
                );
            });

            it("emits a deposited event", async function () {
                account.setDefault(owner);
                const logs = await this.escrow.deposit(payee1).send({ callValue: amount });
                await expectEvent.inTransaction(logs, this.escrow, "Deposited", {
                    payee: account.toHexAddress(payee1, true),
                    weiAmount: amount,
                });
            });

            it("can add multiple deposits on a single account", async function () {
                account.setDefault(owner);
                await this.escrow.deposit(payee1).send({ callValue: amount, shouldPollResponse: true });
                await this.escrow.deposit(payee1).send({ callValue: amount.times(2), shouldPollResponse: true });

                expect(await balance.current(this.escrow.address)).to.be.bignumber.equal(amount.times(3));

                expect(await this.escrow.depositsOf(payee1).call()).to.be.bignumber.equal(amount.times(3));
            });

            it("can track deposits to multiple accounts", async function () {
                account.setDefault(owner);
                await this.escrow.deposit(payee1).send({ callValue: amount, shouldPollResponse: true });
                await this.escrow.deposit(payee2).send({ callValue: amount.times(2), shouldPollResponse: true });

                expect(await balance.current(this.escrow.address)).to.be.bignumber.equal(amount.times(3));

                expect(await this.escrow.depositsOf(payee1).call()).to.be.bignumber.equal(amount);

                expect(await this.escrow.depositsOf(payee2).call()).to.be.bignumber.equal(amount.times(2));
            });
        });

        describe("withdrawals", async function () {
            it("can withdraw payments", async function () {
                const balanceTracker = await balance.tracker(payee1);
                account.setDefault(owner);
                await this.escrow.deposit(payee1).send({ callValue: amount, shouldPollResponse: true });
                await this.escrow.withdraw(payee1).send({ shouldPollResponse: true });

                expect(await balanceTracker.delta()).to.be.bignumber.equal(amount);

                expect(await balance.current(this.escrow.address)).to.be.bignumber.equal("0");
                expect(await this.escrow.depositsOf(payee1).call()).to.be.bignumber.equal("0");
            });

            it("can do an empty withdrawal", async function () {
                account.setDefault(owner);
                await this.escrow.withdraw(payee1).send();
            });

            it("only the owner can withdraw", async function () {
                account.setDefault(payee1);
                await expectRevert(this.escrow.withdraw(payee1).send(),
                    "Ownable: caller is not the owner",
                );
            });

            it("emits a withdrawn event", async function () {
                account.setDefault(owner);
                await this.escrow.deposit(payee1).send({ callValue: amount, shouldPollResponse: true });
                const logs = await this.escrow.withdraw(payee1).send();
                await expectEvent.inTransaction(logs, this.escrow, "Withdrawn", {
                    payee: account.toHexAddress(payee1, true),
                    weiAmount: amount,
                });
            });
        });
    });
}

module.exports = {
    shouldBehaveLikeEscrow,
};
