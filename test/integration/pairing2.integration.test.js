'use strict'

// Libs //
import Initiator from '@clients/initiator'
import Receiver from '@clients/receiver'
import CryptoUtils from '@utils/crypto-utils'
// import WebsocketConnection from '@util/websocket-connection'
import { signals, rtcSignals, roles } from '@signals'
import { stunServers, version, websocketURL, webRTCOptions } from '@config'

// Key Variables //
let publicKey
let privateKey
let connId
let signed
let versionObject

// Clients /
let initiator
let receiver

let _offer
let _answer

describe('Initial Connection', () => {

  beforeAll(async done => {
    // Keys / Connection Details //
    let keys = CryptoUtils.generateKeys()
    publicKey = keys.publicKey
    privateKey = keys.privateKey
    connId = CryptoUtils.generateConnId(publicKey)
    signed = CryptoUtils.signMessage(privateKey, privateKey)
    versionObject = await CryptoUtils.encrypt(version, privateKey)

    // Clients //
    initiator = new Initiator()
    receiver = new Receiver()

    done()
  })

  it('Should connect initiator', async done => {
    await initiator.connect(websocketURL, connId, signed)
    initiator.on(signals.initiated, data => {
      done()
    })
  })

  it('Should connect receiver', async done => {
    await receiver.connect(websocketURL, connId, signed)
    receiver.on(signals.confirmation, data => {
      done()
    }) 
  })

  it('Should send offer', async done => {
    const offer = await initiator.offer()
    const encryptedOffer = await CryptoUtils.encrypt(
      JSON.stringify(offer),
      privateKey
    )
    const data = {
      data: encryptedOffer,
      connId: connId,
      options: stunServers
    }
    initiator.send(signals.offerSignal, data)
    receiver.on(signals.offer, data => {
      _offer = data.data
      console.log('offer', _offer)
      done()
    })

  })

  it('Should send answer', async done => {
    const answer = await receiver.answer(_offer)
    const encryptedAnswer = await CryptoUtils.encrypt(
      JSON.stringify(answer),
      privateKey
    )
    const data = {
      data: encryptedAnswer,
      connId: connId
    }
    receiver.send(signals.answerSignal, data)
    initiator.on(signals.answer, data => {
      _answer = data.data
      done()
    })
  })

})