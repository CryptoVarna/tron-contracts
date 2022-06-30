const { createContract } = require("@cryptovarna/tron-test-helpers");

const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

const { expect } = require("chai");

const MerkleProofWrapper = artifacts.require("MerkleProofWrapper");

contract("MerkleProof", function (accounts) {
    beforeEach(async function () {
        this.merkleProof = await createContract(MerkleProofWrapper);
    });

    describe("verify", function () {
        it("returns true for a valid Merkle proof", async function () {
            const elements = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".split("");
            const merkleTree = new MerkleTree(elements, keccak256, { hashLeaves: true, sortPairs: true });

            const root = merkleTree.getHexRoot();

            const leaf = keccak256(elements[0]);

            const proof = merkleTree.getHexProof(leaf);

            expect(await this.merkleProof.verify(proof, root, leaf).call()).to.equal(true);
        });

        it("returns false for an invalid Merkle proof", async function () {
            const correctElements = ["a", "b", "c"];
            const correctMerkleTree = new MerkleTree(correctElements, keccak256, { hashLeaves: true, sortPairs: true });

            const correctRoot = correctMerkleTree.getHexRoot();

            const correctLeaf = keccak256(correctElements[0]);

            const badElements = ["d", "e", "f"];
            const badMerkleTree = new MerkleTree(badElements);

            const badProof = badMerkleTree.getHexProof(badElements[0], keccak256, { hashLeaves: true, sortPairs: true });

            expect(await this.merkleProof.verify(badProof, correctRoot, correctLeaf).call()).to.equal(false);
        });

        it("returns false for a Merkle proof of invalid length", async function () {
            const elements = ["a", "b", "c"];
            const merkleTree = new MerkleTree(elements, keccak256, { hashLeaves: true, sortPairs: true });

            const root = merkleTree.getHexRoot();

            const leaf = keccak256(elements[0]);

            const proof = merkleTree.getHexProof(leaf);
            const badProof = proof.slice(0, proof.length - 5);

            expect(await this.merkleProof.verify(badProof, root, leaf).call()).to.equal(false);
        });
    });
});
