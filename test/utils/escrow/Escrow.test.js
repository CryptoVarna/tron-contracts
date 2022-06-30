const { account, createContract } = require("@cryptovarna/tron-test-helpers");
const { shouldBehaveLikeEscrow } = require("./Escrow.behavior");

const Escrow = artifacts.require("Escrow");

contract("Escrow", function (accounts) {
    const [owner, ...otherAccounts] = accounts;

    //
    beforeEach(async function () {
        account.setDefault(owner);
        this.escrow = await createContract(Escrow);
    });

    shouldBehaveLikeEscrow(owner, otherAccounts);
});
