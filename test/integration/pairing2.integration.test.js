'use strict'

// Libs //
import Initiator from '@clients/initiator'
import Receiver from '@clients/receiver'
import { signals, rtcSignals, roles } from '@signals'
import { stunServers, version, websocketURL, webRTCOptions } from '@config'

// Clients //
let initiator
let receiver

let webRTCOffer
let webRTCAnswer

describe('Initial Connection', () => {

  beforeAll(async done => {
    // Initiator //
    initiator = new Initiator()
    initiator.generateKeys()

    // Receiver //
    receiver = new Receiver()
    receiver.setKeys(initiator.publicKey, initiator.privateKey, initiator.connId)

    done()
  })

  it('Should connect initiator', async done => {
    await initiator.connect(websocketURL)
    initiator.on(signals.initiated, data => {
      done()
    })
  })

  it('Should connect receiver', async done => {
    await receiver.connect(websocketURL)
    receiver.on(signals.confirmation, data => {
      done()
    }) 
  })

  it('Should send offer', async done => {
    const offer = await initiator.offer()
    const encryptedOffer = await initiator.encrypt(offer)

    const data = {
      data: encryptedOffer,
      options: stunServers
    }
    initiator.send(signals.offerSignal, data)
    receiver.on(signals.offer, async data => {
      webRTCOffer = await receiver.decrypt(data.data)
      done()
    })

  })

  it('Should send answer', async done => {
    const answer = await receiver.answer(webRTCOffer)
    const encryptedAnswer = await receiver.encrypt(answer)

    const data = {
      data: encryptedAnswer
    }

    receiver.send(signals.answerSignal, data)
    initiator.on(signals.answer, async data => {
      webRTCAnswer = await initiator.decrypt(data.data)
      done()
    })
  })

  it('Should establish RTC connection between the initiator and receiver', async done => {
    initiator.signal(webRTCAnswer)

    const initiatorPromise = new Promise((resolve, reject) => {
      initiator.onRTC(rtcSignals.connect, resolve)
    })

    const receiverPromise = new Promise((resolve, reject) => {
      receiver.onRTC(rtcSignals.connect, resolve)
    })

    await Promise.all([
      initiatorPromise,
      receiverPromise
    ])

    done()
  }) 

})