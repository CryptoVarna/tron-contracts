const { BN } = require("@cryptovarna/tron-test-helpers");

const TRC1155Holder = artifacts.require("TRC1155Holder");
const TRC1155Mock = artifacts.require("TRC1155Mock");

const { expect } = require("chai");

const { shouldSupportInterfaces } = require("../../../utils/introspection/SupportsInterface.behavior");

contract("TRC1155Holder", function (accounts) {
    const [creator] = accounts;
    const uri = "https://token-cdn-domain/{id}.json";
    const multiTokenIds = [new BN(1), new BN(2), new BN(3)];
    const multiTokenAmounts = [new BN(1000), new BN(2000), new BN(3000)];
    const transferData = "0x12345678";

    beforeEach(async function () {
        this.multiToken = await TRC1155Mock.new(uri, { from: creator });
        this.holder = await TRC1155Holder.new();
        await this.multiToken.mintBatch(creator, multiTokenIds, multiTokenAmounts, "0x", { from: creator });
    });

    shouldSupportInterfaces(["TRC165", "TRC1155Receiver"]);

    it("receives TRC1155 tokens from a single ID", async function () {
        await this.multiToken.safeTransferFrom(
            creator,
            this.holder.address,
            multiTokenIds[0],
            multiTokenAmounts[0],
            transferData,
            { from: creator },
        );

        expect(await this.multiToken.balanceOf(this.holder.address, multiTokenIds[0]))
            .to.be.bignumber.equal(multiTokenAmounts[0]);

        for (let i = 1; i < multiTokenIds.length; i++) {
            expect(await this.multiToken.balanceOf(this.holder.address, multiTokenIds[i])).to.be.bignumber.equal(new BN(0));
        }
    });

    it("receives TRC1155 tokens from a multiple IDs", async function () {
        for (let i = 0; i < multiTokenIds.length; i++) {
            expect(await this.multiToken.balanceOf(this.holder.address, multiTokenIds[i])).to.be.bignumber.equal(new BN(0));
        };

        await this.multiToken.safeBatchTransferFrom(
            creator,
            this.holder.address,
            multiTokenIds,
            multiTokenAmounts,
            transferData,
            { from: creator },
        );

        for (let i = 0; i < multiTokenIds.length; i++) {
            expect(await this.multiToken.balanceOf(this.holder.address, multiTokenIds[i]))
                .to.be.bignumber.equal(multiTokenAmounts[i]);
        }
    });
});
