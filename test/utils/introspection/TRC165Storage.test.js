const { expectRevert } = require("@cryptovarna/tron-test-helpers");

const { shouldSupportInterfaces } = require("./SupportsInterface.behavior");

const TRC165Mock = artifacts.require("TRC165StorageMock");

contract("TRC165Storage", function (accounts) {
    beforeEach(async function () {
        this.mock = await TRC165Mock.new();
    });

    it("register interface", async function () {
        expect(await this.mock.supportsInterface("0x00000001")).to.be.equal(false);
        await this.mock.registerInterface("0x00000001");
        expect(await this.mock.supportsInterface("0x00000001")).to.be.equal(true);
    });

    it("does not allow 0xffffffff", async function () {
        await expectRevert(this.mock.registerInterface("0xffffffff"), "TRC165: invalid interface id");
    });

    shouldSupportInterfaces([
        "TRC165",
    ]);
});
