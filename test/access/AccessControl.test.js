const { createContract, account } = require("@cryptovarna/tron-test-helpers");
const {
    shouldBehaveLikeAccessControl,
} = require("./AccessControl.behavior.js");

const AccessControlMock = artifacts.require("AccessControlMock");

contract("AccessControl", function (accounts) {
    beforeEach(async function () {
        account.setDefault(accounts[0]);
        this.accessControl = await createContract(AccessControlMock);
    });

    shouldBehaveLikeAccessControl("AccessControl", ...accounts);
});
