const { BN, constants, expectEvent, expectRevert, createContract, account } = require("@cryptovarna/tron-test-helpers");
const { ZERO_ADDRESS_ETH } = constants;
const { shouldSupportInterfaces } = require("../../../utils/introspection/SupportsInterface.behavior");

const { expect } = require("chai");

const TRC721PresetMinterPauserAutoId = artifacts.require("TRC721PresetMinterPauserAutoId");

contract("TRC721PresetMinterPauserAutoId", function (accounts) {
    const [deployer, other] = accounts;

    const name = "MinterAutoIDToken";
    const symbol = "MAIT";
    const baseURI = "my.app/";

    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const MINTER_ROLE = tronWeb.sha3("MINTER_ROLE");

    beforeEach(async function () {
        account.setDefault(deployer);
        this.token = await createContract(TRC721PresetMinterPauserAutoId, name, symbol, baseURI);
    });

    shouldSupportInterfaces(["TRC721", "TRC721Enumerable", "AccessControl", "AccessControlEnumerable"]);

    it("token has correct name", async function () {
        expect(await this.token.name().call()).to.equal(name);
    });

    it("token has correct symbol", async function () {
        expect(await this.token.symbol().call()).to.equal(symbol);
    });

    it("deployer has the default admin role", async function () {
        expect(await this.token.getRoleMemberCount(DEFAULT_ADMIN_ROLE).call()).to.be.bignumber.equal("1");
        expect(await this.token.getRoleMember(DEFAULT_ADMIN_ROLE, 0).call()).to.equal(account.toHexAddress(deployer));
    });

    it("deployer has the minter role", async function () {
        expect(await this.token.getRoleMemberCount(MINTER_ROLE).call()).to.be.bignumber.equal("1");
        expect(await this.token.getRoleMember(MINTER_ROLE, 0).call()).to.equal(account.toHexAddress(deployer));
    });

    it("minter role admin is the default admin", async function () {
        expect(await this.token.getRoleAdmin(MINTER_ROLE).call()).to.equal(DEFAULT_ADMIN_ROLE);
    });

    describe("minting", function () {
        it("deployer can mint tokens", async function () {
            const tokenId = new BN("0");

            account.setDefault(deployer);
            const txId = await this.token.mint(other).send();
            await expectEvent.inTransaction(txId, this.token, "Transfer", {
                from: ZERO_ADDRESS_ETH,
                to: account.toHexAddress(other, true),
                tokenId,
            });

            expect(await this.token.balanceOf(other).call()).to.be.bignumber.equal("1");
            expect(await this.token.ownerOf(tokenId.toFixed()).call()).to.equal(account.toHexAddress(other));

            expect(await this.token.tokenURI(tokenId.toFixed()).call()).to.equal(baseURI + tokenId);
        });

        it("other accounts cannot mint tokens", async function () {
            account.setDefault(other);
            await expectRevert(
                this.token.mint(other).send(),
                "TRC721PresetMinterPauserAutoId: must have minter role to mint",
            );
        });
    });

    describe("pausing", function () {
        it("deployer can pause", async function () {
            account.setDefault(deployer);
            const txId = await this.token.pause().send();
            await expectEvent.inTransaction(txId, this.token, "Paused", { account: account.toHexAddress(deployer, true) });

            expect(await this.token.paused().call()).to.equal(true);
        });

        it("deployer can unpause", async function () {
            account.setDefault(deployer);
            await this.token.pause().send();

            const txId = await this.token.unpause().send();
            await expectEvent.inTransaction(txId, this.token, "Unpaused", { account: account.toHexAddress(deployer, true) });

            expect(await this.token.paused().call()).to.equal(false);
        });

        it("cannot mint while paused", async function () {
            account.setDefault(deployer);
            await this.token.pause().send();

            await expectRevert(
                this.token.mint(other).send(),
                "TRC721Pausable: token transfer while paused",
            );
        });

        it("other accounts cannot pause", async function () {
            account.setDefault(other);
            await expectRevert(
                this.token.pause().send(),
                "TRC721PresetMinterPauserAutoId: must have pauser role to pause",
            );
        });

        it("other accounts cannot unpause", async function () {
            account.setDefault(deployer);
            await this.token.pause().send();

            account.setDefault(other);
            await expectRevert(
                this.token.unpause().send(),
                "TRC721PresetMinterPauserAutoId: must have pauser role to unpause",
            );
        });
    });

    describe("burning", function () {
        it("holders can burn their tokens", async function () {
            const tokenId = new BN("0");

            account.setDefault(deployer);
            await this.token.mint(other).send();

            account.setDefault(other);
            const txId = await this.token.burn(tokenId.toFixed()).send();

            await expectEvent.inTransaction(txId, this.token, "Transfer",
                {
                    from: account.toHexAddress(other, true),
                    to: ZERO_ADDRESS_ETH,
                    tokenId,
                });

            expect(await this.token.balanceOf(other).call()).to.be.bignumber.equal("0");
            expect(await this.token.totalSupply().call()).to.be.bignumber.equal("0");
        });
    });
});
