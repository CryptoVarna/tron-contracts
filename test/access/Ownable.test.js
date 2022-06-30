const { account, createContract, constants, expectEvent, expectRevert } = require("@cryptovarna/tron-test-helpers");
const { ZERO_ADDRESS } = constants;

const { expect } = require("chai");

const Ownable = artifacts.require("OwnableMock");

contract("Ownable", function ([owner, other]) {

    beforeEach(async function () {
        this.ownable = await createContract(Ownable);
    });

    it("has an owner", async function () {
        expect(await this.ownable.owner().call()).to.equal(account.toHexAddress(owner));
    });

    describe("transfer ownership", function () {
        it("changes owner after transfer", async function () {
            account.setDefault(owner);
            const txId = await this.ownable.transferOwnership(other).send();
            await expectEvent.inTransaction(txId, this.ownable, "OwnershipTransferred");

            expect(await this.ownable.owner().call()).to.equal(account.toHexAddress(other));
        });

        it("prevents non-owners from transferring", async function () {
            account.setDefault(other);
            await expectRevert(
                this.ownable.transferOwnership(other).send(),
                "Ownable: caller is not the owner",
            );
        });

        it("guards ownership against stuck state", async function () {
            account.setDefault(owner);
            await expectRevert(
                this.ownable.transferOwnership(ZERO_ADDRESS).send(),
                "Ownable: new owner is the zero address",
            );
        });
    });

    describe("renounce ownership", function () {
        it("loses owner after renouncement", async function () {
            account.setDefault(owner);
            const txId = await this.ownable.renounceOwnership().send();
            expectEvent.inTransaction(txId, this.ownable, "OwnershipTransferred");

            expect(await this.ownable.owner().call()).to.equal(ZERO_ADDRESS);
        });

        it("prevents non-owners from renouncement", async function () {
            account.setDefault(other);
            await expectRevert(
                this.ownable.renounceOwnership().send(),
                "Ownable: caller is not the owner",
            );
        });
    });
});
