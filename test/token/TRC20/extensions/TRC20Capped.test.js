const { BN, trx, expectRevert, createContract, account } = require("@cryptovarna/tron-test-helpers");
const { shouldBehaveLikeTRC20Capped } = require("./TRC20Capped.behavior");

const TRC20Capped = artifacts.require("TRC20CappedMock");
const TRC20CappedFail = artifacts.require("TRC20CappedFailMock");

contract("TRC20Capped", function (accounts) {
    const [minter, ...otherAccounts] = accounts;

    const cap = trx("1000");

    const name = "My Token";
    const symbol = "MTKN";

    it("requires a non-zero cap", async function () {
        account.setDefault(minter);
        const mock = await createContract(TRC20CappedFail);
        await expectRevert(mock.mockConstructor(name, symbol, "0").send(), "TRC20Capped: cap is 0",);
    });

    context("once deployed", async function () {
        beforeEach(async function () {
            account.setDefault(minter);
            this.token = await createContract(TRC20Capped, name, symbol, cap.toFixed());
        });

        shouldBehaveLikeTRC20Capped(minter, otherAccounts, cap);
    });
});
