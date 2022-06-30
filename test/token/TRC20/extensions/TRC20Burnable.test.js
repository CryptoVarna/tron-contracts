const { BN, createContract, account } = require("@cryptovarna/tron-test-helpers");

const { shouldBehaveLikeTRC20Burnable } = require("./TRC20Burnable.behavior");
const TRC20BurnableMock = artifacts.require("TRC20BurnableMock");

contract("TRC20Burnable", function (accounts) {
    const [owner, ...otherAccounts] = accounts;

    const initialBalance = new BN(1000);

    const name = "My Token";
    const symbol = "MTKN";

    beforeEach(async function () {
        account.setDefault(owner);
        this.token = await createContract(TRC20BurnableMock, name, symbol, owner, initialBalance.toFixed());
    });

    shouldBehaveLikeTRC20Burnable(owner, initialBalance, otherAccounts);
});
