const assert = require('chai').assert
const Keyring = require('../keyring')
const bip39 = require('bip39')
const nacl = require('tweetnacl')
nacl.util = require('tweetnacl-util')

// These are just random ipfs hashes
const DIDS = [
  'did:muport:QmZZBBKPS2NWc6PMZbUk9zUHCo1SHKzQPPX4ndfwaYzmPW',
  'did:muport:QmWfn55PTKTwCbdiEKgqdYXdJuHn25y6z7vwoV7QKLddVY',
  'did:muport:Qmbd63DgTfEH2xkLKfpVJovdqwZyZmrAkiEKV4do3nEPSU'
]

describe('Keyring', () => {

  let keyring1
  const mnemonic = 'clay rubber drama brush salute cream nerve wear stuff sentence trade conduct'
  const publicKeys = {
    signingKey: '028aaa695fa16f2a2279e1de718d80e00f4f4ddf30fe8674bbdb9e1f11778c2f77',
    managementKey: '0291888f1c8cff90aea41cf97dc9b015f2185983524a5e6df888401565239d4d8a',
    asymEncryptionKey: 'wW1wkjQ7kaZiBvk4bhukQ15Idx6d31XKFpq/jeup5nc='
  }
  const keyring2 = new Keyring()
  const keyring3 = new Keyring()

  it('derives correct keys from mnemonic', () => {
    keyring1 = new Keyring({mnemonic})

    assert.deepEqual(keyring1.getPublicKeys(), publicKeys)
    assert.deepEqual(keyring1.serialize().mnemonic, mnemonic)
  })

  it('encrypts and decrypts correctly', () => {
    const testMsg = "Very secret test message"
    let box = keyring1.encrypt(testMsg, keyring2.getPublicKeys().asymEncryptionKey)

    let cleartext = keyring2.decrypt(box.ciphertext, keyring1.getPublicKeys().asymEncryptionKey, box.nonce)
    assert.equal(cleartext, testMsg)
  })

  it('splits shares correctly', async () => {
    delegatePubKeys = [
      keyring1.getPublicKeys().asymEncryptionKey,
      keyring2.getPublicKeys().asymEncryptionKey,
      keyring3.getPublicKeys().asymEncryptionKey
    ]
    const recoveryNetwork = await keyring1.createShares(DIDS, delegatePubKeys)
    const share2 = keyring2.decryptOneShare(recoveryNetwork, delegatePubKeys[0], DIDS[1])
    const share3 = keyring3.decryptOneShare(recoveryNetwork, delegatePubKeys[0], DIDS[2])

    const recoveredKeyring = await Keyring.recoverKeyring([share2, share3])
    assert.deepEqual(recoveredKeyring.getPublicKeys(), publicKeys)
  })
})