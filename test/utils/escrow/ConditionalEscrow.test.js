const { account, expectRevert, createContract, trx } = require("@cryptovarna/tron-test-helpers");
const { shouldBehaveLikeEscrow } = require("./Escrow.behavior");

const ConditionalEscrowMock = artifacts.require("ConditionalEscrowMock");

contract("ConditionalEscrow", function (accounts) {
    const [owner, payee, ...otherAccounts] = accounts;

    beforeEach(async function () {
        account.setDefault(owner);
        this.escrow = await createContract(ConditionalEscrowMock);
    });

    context("when withdrawal is allowed", function () {
        beforeEach(async function () {
            await Promise.all(otherAccounts.map(payee => this.escrow.setAllowed(payee, true).send()));
        });

        shouldBehaveLikeEscrow(owner, otherAccounts);
    });

    context("when withdrawal is disallowed", function () {
        const amount = trx("23");

        beforeEach(async function () {
            await this.escrow.setAllowed(payee, false).send();
        });

        it("reverts on withdrawals", async function () {
            await this.escrow.deposit(payee).send({ callValue: amount, shouldPollResponse: true });

            await expectRevert(this.escrow.withdraw(payee).send(),
                "ConditionalEscrow: payee is not allowed to withdraw",
            );
        });
    });
});
