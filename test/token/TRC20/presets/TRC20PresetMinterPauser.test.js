const { BN, constants, expectEvent, expectRevert, createContract, account } = require("@cryptovarna/tron-test-helpers");
const { ZERO_ADDRESS_ETH } = constants;

const { expect } = require("chai");

const TRC20PresetMinterPauser = artifacts.require("TRC20PresetMinterPauser");

contract("TRC20PresetMinterPauser", function (accounts) {
    const [deployer, other] = accounts;

    const name = "MinterPauserToken";
    const symbol = "DRT";

    const amount = new BN("5000");

    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const MINTER_ROLE = tronWeb.sha3("MINTER_ROLE");
    const PAUSER_ROLE = tronWeb.sha3("PAUSER_ROLE");

    beforeEach(async function () {
        account.setDefault(deployer);
        this.token = await createContract(TRC20PresetMinterPauser, name, symbol);
    });

    it("deployer has the default admin role", async function () {
        expect(await this.token.getRoleMemberCount(DEFAULT_ADMIN_ROLE).call()).to.be.bignumber.equal("1");
        expect(await this.token.getRoleMember(DEFAULT_ADMIN_ROLE, 0).call()).to.equal(account.toHexAddress(deployer));
    });

    it("deployer has the minter role", async function () {
        expect(await this.token.getRoleMemberCount(MINTER_ROLE).call()).to.be.bignumber.equal("1");
        expect(await this.token.getRoleMember(MINTER_ROLE, 0).call()).to.equal(account.toHexAddress(deployer));
    });

    it("deployer has the pauser role", async function () {
        expect(await this.token.getRoleMemberCount(PAUSER_ROLE).call()).to.be.bignumber.equal("1");
        expect(await this.token.getRoleMember(PAUSER_ROLE, 0).call()).to.equal(account.toHexAddress(deployer));
    });

    it("minter and pauser role admin is the default admin", async function () {
        expect(await this.token.getRoleAdmin(MINTER_ROLE).call()).to.equal(DEFAULT_ADMIN_ROLE);
        expect(await this.token.getRoleAdmin(PAUSER_ROLE).call()).to.equal(DEFAULT_ADMIN_ROLE);
    });

    describe("minting", function () {
        it("deployer can mint tokens", async function () {
            account.setDefault(deployer);
            const txId = await this.token.mint(other, amount.toFixed()).send();
            await expectEvent.inTransaction(txId, this.token, "Transfer",
                {
                    from: ZERO_ADDRESS_ETH,
                    to: account.toHexAddress(other, true),
                    value: amount,
                });

            expect(BN.fromHex(await this.token.balanceOf(other).call())).to.be.bignumber.equal(amount);
        });

        it("other accounts cannot mint tokens", async function () {
            account.setDefault(other);
            await expectRevert(
                this.token.mint(other, amount.toFixed()).send(),
                "TRC20PresetMinterPauser: must have minter role to mint",
            );
        });
    });

    describe("pausing", function () {
        it("deployer can pause", async function () {
            account.setDefault(deployer);
            const txId = await this.token.pause().send();
            await expectEvent.inTransaction(txId, this.token, "Paused",
                { account: account.toHexAddress(deployer, true) });

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
                this.token.mint(other, amount.toFixed()).send(),
                "TRC20Pausable: token transfer while paused",
            );
        });

        it("other accounts cannot pause", async function () {
            account.setDefault(other);
            await expectRevert(
                this.token.pause().send(),
                "TRC20PresetMinterPauser: must have pauser role to pause",
            );
        });

        it("other accounts cannot unpause", async function () {
            account.setDefault(deployer);
            await this.token.pause().send({ shouldPollResponse: false });

            account.setDefault(other);
            await expectRevert(
                this.token.unpause().send(),
                "TRC20PresetMinterPauser: must have pauser role to unpause",
            );
        });
    });

    describe("burning", function () {
        it("holders can burn their tokens", async function () {
            account.setDefault(deployer);
            await this.token.mint(other, amount.toFixed()).send();

            account.setDefault(other);
            const txId = await this.token.burn(amount.minus(1).toFixed()).send();
            await expectEvent.inTransaction(txId, this.token, "Transfer",
                {
                    from: account.toHexAddress(other, true),
                    to: ZERO_ADDRESS_ETH,
                    value: amount.minus(1),
                });

            expect(BN.fromHex(await this.token.balanceOf(other).call())).to.be.bignumber.equal("1");
        });
    });
});
