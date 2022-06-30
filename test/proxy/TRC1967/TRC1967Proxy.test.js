const shouldBehaveLikeProxy = require("../Proxy.behaviour");

const TRC1967Proxy = artifacts.require("TRC1967Proxy");

contract("TRC1967Proxy", function (accounts) {
    const [proxyAdminOwner] = accounts;

    const createProxy = async function (implementation, _admin, initData, opts) {
        return TRC1967Proxy.new(implementation, initData, opts);
    };

    shouldBehaveLikeProxy(createProxy, undefined, proxyAdminOwner);
});
