const { createContract, account } = require("@cryptovarna/tron-test-helpers");
const {
    shouldBehaveLikeAccessControl,
    shouldBehaveLikeAccessControlEnumerable,
} = require("./AccessControl.behavior.js");

const AccessControlMock = artifacts.require("AccessControlEnumerableMock");

contract("AccessControl", function (accounts) {
    beforeEach(async function () {
        account.setDefault(accounts[0]);
        this.accessControl = await createContract(AccessControlMock);
    });

    shouldBehaveLikeAccessControl("AccessControl", ...accounts);
    shouldBehaveLikeAccessControlEnumerable("AccessControl", ...accounts);
});
