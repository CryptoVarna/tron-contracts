const { BN, expectEvent, expectRevert, account, bytes } = require("@cryptovarna/tron-test-helpers");
const { expect } = require("chai");

const { shouldSupportInterfaces } = require("../utils/introspection/SupportsInterface.behavior");

const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
const ROLE = tronWeb.sha3("ROLE");
const OTHER_ROLE = tronWeb.sha3("OTHER_ROLE");

function shouldBehaveLikeAccessControl(errorPrefix, admin, authorized, other, otherAdmin, otherAuthorized) {
    shouldSupportInterfaces(["AccessControl"]);

    describe("default admin", function () {
        it("deployer has default admin role", async function () {
            expect(await this.accessControl.hasRole(DEFAULT_ADMIN_ROLE, admin).call()).to.equal(true);
        });

        it("other roles's admin is the default admin role", async function () {
            expect(await this.accessControl.getRoleAdmin(ROLE).call()).to.equal(DEFAULT_ADMIN_ROLE);
        });

        it("default admin role's admin is itself", async function () {
            expect(await this.accessControl.getRoleAdmin(DEFAULT_ADMIN_ROLE).call()).to.equal(DEFAULT_ADMIN_ROLE);
        });
    });

    describe("granting", function () {
        beforeEach(async function () {
            account.setDefault(admin);
            await this.accessControl.grantRole(ROLE, authorized).send();
        });

        it("non-admin cannot grant role to other accounts", async function () {
            account.setDefault(other);
            await expectRevert(
                this.accessControl.grantRole(ROLE, authorized).send(),
                `${errorPrefix}: account ${account.toHexAddress(other, true).toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`,
            );
        });

        it("accounts can be granted a role multiple times", async function () {
            account.setDefault(admin);
            await this.accessControl.grantRole(ROLE, authorized).send();
            const txId = await this.accessControl.grantRole(ROLE, authorized).send();
            await expectEvent.notEmitted.inTransaction(txId, this.accessControl, "RoleGranted");
        });
    });

    describe("revoking", function () {
        it("roles that are not had can be revoked", async function () {
            expect(await this.accessControl.hasRole(ROLE, authorized).call()).to.equal(false);

            account.setDefault(admin);
            const txId = await this.accessControl.revokeRole(ROLE, authorized).send();
            await expectEvent.notEmitted.inTransaction(txId, this.accessControl, "RoleRevoked");
        });

        context("with granted role", function () {
            beforeEach(async function () {
                account.setDefault(admin);
                await this.accessControl.grantRole(ROLE, authorized).send();
            });

            it("admin can revoke role", async function () {
                account.setDefault(admin);
                const txId = await this.accessControl.revokeRole(ROLE, authorized).send();
                await expectEvent.inTransaction(txId, this.accessControl, "RoleRevoked",
                    {
                        account: account.toHexAddress(authorized, true),
                        role: bytes.without0x(ROLE),
                        sender: account.toHexAddress(admin, true),
                    });

                expect(await this.accessControl.hasRole(ROLE, authorized).call()).to.equal(false);
            });

            it("non-admin cannot revoke role", async function () {
                account.setDefault(other);
                await expectRevert(
                    this.accessControl.revokeRole(ROLE, authorized).send(),
                    `${errorPrefix}: account ${account.toHexAddress(other, true).toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`,
                );
            });

            it("a role can be revoked multiple times", async function () {
                account.setDefault(admin);
                await this.accessControl.revokeRole(ROLE, authorized).send();

                const txId = await this.accessControl.revokeRole(ROLE, authorized).send();
                await expectEvent.notEmitted.inTransaction(txId, this.accessControl, "RoleRevoked");
            });
        });
    });

    describe("renouncing", function () {
        it("roles that are not had can be renounced", async function () {
            account.setDefault(authorized);
            const txId = await this.accessControl.renounceRole(ROLE, authorized).send();
            await expectEvent.notEmitted.inTransaction(txId, this.accessControl, "RoleRevoked");
        });

        context("with granted role", function () {
            beforeEach(async function () {
                account.setDefault(admin);
                await this.accessControl.grantRole(ROLE, authorized).send();
            });

            it("bearer can renounce role", async function () {
                account.setDefault(authorized);
                const txId = await this.accessControl.renounceRole(ROLE, authorized).send();
                await expectEvent.inTransaction(txId, this.accessControl, "RoleRevoked",
                    {
                        account: account.toHexAddress(authorized, true),
                        role: bytes.without0x(ROLE),
                        sender: account.toHexAddress(authorized, true),
                    });

                expect(await this.accessControl.hasRole(ROLE, authorized).call()).to.equal(false);
            });

            it("only the sender can renounce their roles", async function () {
                account.setDefault(admin);
                await expectRevert(
                    this.accessControl.renounceRole(ROLE, authorized).send(),
                    `${errorPrefix}: can only renounce roles for self`,
                );
            });

            it("a role can be renounced multiple times", async function () {
                account.setDefault(authorized);
                await this.accessControl.renounceRole(ROLE, authorized).send();

                const txId = await this.accessControl.renounceRole(ROLE, authorized).send();
                await expectEvent.notEmitted.inTransaction(txId, this.accessControl, "RoleRevoked");
            });
        });
    });

    describe("setting role admin", function () {
        beforeEach(async function () {
            const txId = await this.accessControl.setRoleAdmin(ROLE, OTHER_ROLE).send();
            await expectEvent.inTransaction(txId, this.accessControl, "RoleAdminChanged", {
                role: bytes.without0x(ROLE),
                previousAdminRole: bytes.without0x(DEFAULT_ADMIN_ROLE),
                newAdminRole: bytes.without0x(OTHER_ROLE),
            });

            account.setDefault(admin);
            await this.accessControl.grantRole(OTHER_ROLE, otherAdmin).send();
        });

        it("a role's admin role can be changed", async function () {
            expect(await this.accessControl.getRoleAdmin(ROLE).call()).to.equal(OTHER_ROLE);
        });

        it("the new admin can grant roles", async function () {
            account.setDefault(otherAdmin);
            const txId = await this.accessControl.grantRole(ROLE, authorized).send();
            await expectEvent.inTransaction(txId, this.accessControl, "RoleGranted",
                {
                    account: account.toHexAddress(authorized, true),
                    role: bytes.without0x(ROLE),
                    sender: account.toHexAddress(otherAdmin, true),
                });
        });

        it("the new admin can revoke roles", async function () {
            account.setDefault(otherAdmin);
            await this.accessControl.grantRole(ROLE, authorized).send();
            const txId = await this.accessControl.revokeRole(ROLE, authorized).send();
            await expectEvent.inTransaction(txId, this.accessControl, "RoleRevoked",
                {
                    account: account.toHexAddress(authorized, true),
                    role: bytes.without0x(ROLE),
                    sender: account.toHexAddress(otherAdmin, true),
                });
        });

        it("a role's previous admins no longer grant roles", async function () {
            account.setDefault(admin);
            await expectRevert(
                this.accessControl.grantRole(ROLE, authorized).send(),
                `${errorPrefix}: account ${account.toHexAddress(admin, true).toLowerCase()} is missing role ${OTHER_ROLE}`,
            );
        });

        it("a role's previous admins no longer revoke roles", async function () {
            account.setDefault(admin);
            await expectRevert(
                this.accessControl.revokeRole(ROLE, authorized).send(),
                `${errorPrefix}: account ${account.toHexAddress(admin, true).toLowerCase()} is missing role ${OTHER_ROLE}`,
            );
        });
    });

    describe("onlyRole modifier", function () {
        beforeEach(async function () {
            account.setDefault(admin);
            await this.accessControl.grantRole(ROLE, authorized).send();
        });

        it("do not revert if sender has role", async function () {
            account.setDefault(authorized);
            await this.accessControl.senderProtected(ROLE).send();
        });

        it("revert if sender doesn't have role #1", async function () {
            account.setDefault(other);
            await expectRevert(
                this.accessControl.senderProtected(ROLE).send(),
                `${errorPrefix}: account ${account.toHexAddress(other, true).toLowerCase()} is missing role ${ROLE}`,
            );
        });

        it("revert if sender doesn't have role #2", async function () {
            account.setDefault(authorized);
            await expectRevert(
                this.accessControl.senderProtected(OTHER_ROLE).send(),
                `${errorPrefix}: account ${account.toHexAddress(authorized, true).toLowerCase()} is missing role ${OTHER_ROLE}`,
            );
        });
    });
}

function shouldBehaveLikeAccessControlEnumerable(errorPrefix, admin, authorized, other, otherAdmin, otherAuthorized) {
    shouldSupportInterfaces(["AccessControlEnumerable"]);

    describe("enumerating", function () {
        it("role bearers can be enumerated", async function () {
            account.setDefault(admin);
            await this.accessControl.grantRole(ROLE, authorized).send();
            await this.accessControl.grantRole(ROLE, other).send();
            await this.accessControl.grantRole(ROLE, otherAuthorized).send();
            await this.accessControl.revokeRole(ROLE, other).send();

            const memberCount = BN.fromHex(await this.accessControl.getRoleMemberCount(ROLE).call());
            expect(memberCount).to.bignumber.equal("2");

            const bearers = [];
            for (let i = 0; i < memberCount; ++i) {
                bearers.push(await this.accessControl.getRoleMember(ROLE, i).call());
            }

            expect(bearers).to.have.members(
                [
                    account.toHexAddress(authorized),
                    account.toHexAddress(otherAuthorized),
                ]);
        });
        it("role enumeration should be in sync after renounceRole call", async function () {
            expect(BN.fromHex(await this.accessControl.getRoleMemberCount(ROLE).call())).to.bignumber.equal("0");
            account.setDefault(admin);
            await this.accessControl.grantRole(ROLE, admin).send();
            expect(BN.fromHex(await this.accessControl.getRoleMemberCount(ROLE).call())).to.bignumber.equal("1");
            await this.accessControl.renounceRole(ROLE, admin).send();
            expect(BN.fromHex(await this.accessControl.getRoleMemberCount(ROLE).call())).to.bignumber.equal("0");
        });
    });
}

module.exports = {
    shouldBehaveLikeAccessControl,
    shouldBehaveLikeAccessControlEnumerable,
};
