# Description

TRON version of the OpenZepplin contracts for Solidity 0.8.0.
Covered by tests too.

## access

- [x] AccessControl
- [x] AccessControlEnumerable
- [x] Ownable

## cryptography

- [x] ECDSA
- [x] MerkleProof
- [ ] draft-TIP712
- [x] SignatureChecker

## utils

### escrow

- [x] Escrow
- [x] ConditionalEscrow
- [ ] [RefundEscrow](test/utils/escrow/RefundEscrow.test.js) 17/19

### math

- [x] Math
- [x] SafeMath
- [x] SignedSafeMath
- [x] SafeCast

## finance

- [x] PaymentSplitter

## token

### TRC20

- [x] TRC20
- [x] utils/SafeTRC20
- [ ] utils/TokenTimelock
- [x] presets/TRC20PresetFixedSupply
- [x] presets/TRC20PresetMinterPauser
- [x] extensions/TRC20Burnable
- [x] extensions/TRC20Capped
- [x] extensions/TRC20Snapshot
- [x] extensions/TRC20FlashMint
- [x] extensions/TRC20Pausable
- [x] extensions/TRC20Wrapper

### TRC721

- [x] TRC721
- [x] utils/TRC721Holder
- [x] utils/TRC721Enumerable
- [x] presets/TRC721PresetMinterPauserAutoId
- [x] extensions/TRC721Burnable
- [x] extensions/TRC721Pausable
- [x] extensions/TRC721URIStorage
