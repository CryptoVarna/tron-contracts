const { expectRevert, account } = require("@cryptovarna/tron-test-helpers");

const { expect } = require("chai");

function shouldBehaveLikeTRC20Capped(minter, [other], cap) {
    describe("capped token", function () {
        const from = minter;

        it("starts with the correct cap", async function () {
            expect(await this.token.cap().call()).to.be.bignumber.equal(cap);
        });

        it("mints when amount is less than cap", async function () {
            account.setDefault(from);
            await this.token.mint(other, cap.minus(1).toFixed()).send({ shouldPollResponse: true });
            expect(await this.token.totalSupply().call()).to.be.bignumber.equal(cap.minus(1));
        });

        it("fails to mint if the amount exceeds the cap", async function () {
            account.setDefault(from);
            await this.token.mint(other, cap.minus(1).toFixed()).send();
            await expectRevert(this.token.mint(other, 2).send(), "TRC20Capped: cap exceeded");
        });

        it("fails to mint after cap is reached", async function () {
            account.setDefault(from);
            await this.token.mint(other, cap.toFixed()).send();
            await expectRevert(this.token.mint(other, 1).send(), "TRC20Capped: cap exceeded");
        });
    });
}

module.exports = {
    shouldBehaveLikeTRC20Capped,
};
