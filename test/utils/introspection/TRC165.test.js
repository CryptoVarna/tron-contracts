const { shouldSupportInterfaces } = require("./SupportsInterface.behavior");

const TRC165Mock = artifacts.require("TRC165Mock");

contract("TRC165", function (accounts) {
    beforeEach(async function () {
        this.mock = await TRC165Mock.new();
    });

    shouldSupportInterfaces([
        "TRC165",
    ]);
});
