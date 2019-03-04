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

/*
===================================================================================
  Test "Member Functions"
===================================================================================
*/

/**
 * Set a timeout to perform callback after process.env.CONNECTION_TIMEOUT
 * @param  {Function} done - Callback function to perform (usually passing a test)
 */
const pass = async done => {
  setTimeout(done, process.env.CONNECTION_TIMEOUT)
}

/*
===================================================================================
  Test Start
===================================================================================
*/
describe('Pairing', () => {

  beforeAll(async done => {
    // Initiator //
    initiator = new Initiator()
    initiator.generateKeys()

    // Receiver //
    receiver = new Receiver()
    receiver.setKeys(initiator.publicKey, initiator.privateKey, initiator.connId)

    done()
  })

  /*
  ===================================================================================
    1. Pairing -> Initial Connection
  ===================================================================================
  */
  describe('Initial Connection', () => {
    /*
    ===================================================================================
      1a. Pairing -> Initial Connection -> Connect [Initiator → Server]
    ===================================================================================
    */
    describe('Connect [Initiator → Server]', () => {

      /*
      ===================================================================================
        1a. Pairing -> Initial Connection -> Connect [Initiator → Server] -> FAIL
      ===================================================================================
      */
      describe('<FAIL>', () => {
        it('Should not connect with missing @role property', async done => {
          try {
            await initiator.connect(websocketURL, { connId: initiator.connId, signed: initiator.signed })
            done.fail(new Error('Connected with missing @role property'))
          } catch (e) {
            done()
          }
        })
        it('Should not connect with invalid @role property', async done => {
          try {
            await initiator.connect(websocketURL, { role: 'invalid', connId: initiator.connId, signed: initiator.signed })
            done.fail(new Error('Connected with invalid @role property'))
          } catch (e) {
            done()
          }
        })
        it('Should not connect with missing @connId property', async done => {
          try {
            await initiator.connect(websocketURL, { role: roles.initiator, signed: initiator.signed })
            done.fail(new Error('Connected with invalid @role property'))
          } catch (e) {
            done()
          }
        })
        it('Should not connect with invalid @connId property', async done => {
          try {
            await initiator.connect(websocketURL, { role: roles.initiator, connId: 'invalid', signed: initiator.signed })
            done.fail(new Error('Connected with invalid @connId property'))
          } catch (e) {
            done()
          }
        })
        it('Should not connect with missing @signed property', async done => {
          try {
            await initiator.connect(websocketURL, { roles: roles.initiator, connId: initiator.connId })
            done.fail(new Error('Connected with missing @signed property'))
          } catch (e) {
            done()
          }
        })
      })
      /*
      ===================================================================================
        1a. Pairing -> Initial Connection -> Connect [Initiator → Server] -> SUCCESS
      ===================================================================================
      */
      describe('<SUCCESS>', () => {
        it('Should successfully initiate socket connection', async done => {
          try {
            await initiator.connect(websocketURL)
            initiator.on(signals.initiated, data => {
              done()
            })
          } catch (e) {
            done.fail(new Error('Failed to connect'))
          }
        })
      })
      /*
      ===================================================================================
        1a. Pairing -> Initial Connection -> Connect [Initiator → Server] -> FAIL (ROUND 2)
      ===================================================================================
      */
      describe('<FAIL>', () => {
        it('Should not be able to connect twice with the same credentials', async done => {
          try {
            await initiator.connect(websocketURL)
            done.fail(new Error('Connected twice with the same credentials'))
          } catch (e) {
            done()
          }
        })
      })
    })
    /*
    ===================================================================================
      1b. Pairing -> Initial Connection -> Connect [Receiver → Server]
    ===================================================================================
    */
    describe('Connect [Receiver → Server]', () => {

      /*
      ===================================================================================
        1b. Pairing -> Initial Connection -> Connect [Receiver → Server] -> FAIL
      ===================================================================================
      */
      describe('<FAIL>', () => {
        it('Should not connect with missing @role property', async done => {
          try {
            await receiver.connect(websocketURL, { connId: receiver.connId, signed: receiver.signed })
            done.fail(new Error('Connected with missing @role property'))
          } catch (e) {
            done()
          }
        })
        it('Should not connect with invalid @role property', async done => {
          try {
            await receiver.connect(websocketURL, { role: 'invalid', connId: receiver.connId, signed: receiver.signed })
            done.fail(new Error('Connected with invalid @role property'))
          } catch (e) {
            done()
          }
        })
        it('Should not connect with missing @connId property', async done => {
          try {
            await receiver.connect(websocketURL, { role: roles.receiver, signed: receiver.signed })
            done.fail(new Error('Connected with invalid @role property'))
          } catch (e) {
            done()
          }
        })
        it('Should not connect with unmatched @connId property', async done => {
          try {
            await receiver.connect(websocketURL, { role: roles.receiver, connId: receiver.connId.slice(0, -10) + 'abcdeabcde', signed: receiver.signed })
            done.fail(new Error('Connected with invalid @connId property'))
          } catch (e) {
            done()
          }
        })
        it('Should not connect with invalid @connId property', async done => {
          try {
            await receiver.connect(websocketURL, { role: roles.receiver, connId: 'invalid', signed: receiver.signed })
            done.fail(new Error('Connected with invalid @connId property'))
          } catch (e) {
            done()
          }
        })
        it('Should not connect with missing @signed property', async done => {
          try {
            await receiver.connect(websocketURL, { roles: roles.receiver, connId: receiver.connId })
            done.fail(new Error('Connected with missing @signed property'))
          } catch (e) {
            done()
          }
        })
        it('Should not connect with unmatched @signed property', async done => {
          try {
            await receiver.connect(websocketURL, { roles: roles.receiver, connId: receiver.connId, signed: receiver.signed.slice(0, -10) + 'abcdeabcde' })
            done.fail(new Error('Connected with missing @signed property'))
          } catch (e) {
            done()
          }
        })
      })
      /*
      ===================================================================================
        1b. Pairing -> Initial Connection -> Connect [Receiver → Server] -> SUCCESS
      ===================================================================================
      */
      describe('<SUCCESS>', () => {
        it('Should successfully initiate socket connection', async done => {
          await receiver.connect(websocketURL)
          const initiatorPromise = new Promise((resolve, reject) => {
            initiator.on(signals.confirmation, resolve)
          })
          const receiverPromise = new Promise((resolve, reject) => {
            receiver.on(signals.confirmation, resolve)
          })
          await Promise.all([initiatorPromise, receiverPromise])
          done()
        })
      })
      /*
      ===================================================================================
        1b. Pairing -> Initial Connection -> Connect [Receiver → Server] -> FAIL (ROUND 2)
      ===================================================================================
      */
      describe('<FAIL>', () => {
        it('Should not be able to connect twice with the same credentials', async done => {
          try {
            await receiver.connect(websocketURL)
            done.fail(new Error('Connected twice with the same credentials'))
          } catch (e) {
            done()
          }
        })
      })
    })
  })

  /*
  ===================================================================================
    2. Pairing -> Offer Creation
  ===================================================================================
  */
  describe('Offer Creation', () => {
    /*
    ===================================================================================
      2a. Pairing -> Offer Creation -> OfferSignal [Initiator → Server]
    ===================================================================================
    */
    describe('OfferSignal [Initiator → Server]', () => {
      /*
      ===================================================================================
        2a. Pairing -> Offer Creation -> OfferSignal [Initiator → Server] -> FAIL
      ===================================================================================
      */
      describe('<FAIL>', () => {
        it('Should not succeed with missing @data property', async done => {
          const message = {}
          initiator.send(signals.offerSignal, message)
          receiver.on(signals.offer, async data => {
            done.fail(new Error('Succeeded with missing @data property'))
          })
          pass(done)
        })
        it('Should not succeed with invalid @data property', async done => {
          const message = {
            data: 'invalid'
          }
          initiator.send(signals.offerSignal, message)
          receiver.on(signals.offer, async data => {
            done.fail(new Error('Succeeded with missing @data property'))
          })
          pass(done)
        })
      })
      /*
      ===================================================================================
        2a. Pairing -> Offer Creation -> OfferSignal [Initiator → Server] -> SUCCESS
      ===================================================================================
      */
      describe('<SUCCESS>', () => {
        it('Should send an offer and server list to the SignalServer for retransmission to the receiver', async done => {
          const offer = await initiator.offer()
          const message = { data: offer }
          initiator.send(signals.offerSignal, message)
          receiver.on(signals.offer, async data => {
            webRTCOffer = await receiver.decrypt(data.data)
            const expectedVersionProperties = ['type', 'sdp']
            expect(Object.keys(webRTCOffer)).toEqual(
              expect.arrayContaining(expectedVersionProperties)
            )
            done()
          })
        })
      })
    })
  })

  /*
  ===================================================================================
    3. Pairing -> Answer Creation
  ===================================================================================
  */
  describe('Answer Creation', () => {
    /*
    ===================================================================================
      3a. Pairing -> Answer Creation -> AnswerSignal [Receiver → Server]
    ===================================================================================
    */
    describe('AnswerSignal [Receiver → Server]', () => {
      /*
      ===================================================================================
        3a. Pairing -> Answer Creation -> AnswerSignal [Receiver → Server] -> FAIL
      ===================================================================================
      */
      describe('<FAIL>', () => {
        it('Should not succeed with missing @data property', async done => {
          const message = {}
          receiver.send(signals.answerSignal, message)
          initiator.on(signals.answer, async data => {
            done.fail(new Error('Succeeded with missing @data property'))
          })
          pass(done)
        })
        it('Should not connect with invalid @data property', async done => {
          const message = {
            data: 'invalid'
          }
          receiver.send(signals.answerSignal, message)
          initiator.on(signals.answer, async data => {
            done.fail(new Error('Succeeded with missing @data property'))
          })
          pass(done)
        })
      })
      /*
      ===================================================================================
        3a. Pairing -> Answer Creation -> AnswerSignal [Receiver → Server] -> SUCCESS
      ===================================================================================
      */
      describe('<SUCCESS>', () => {
        it('Should transmit an answer to the received offer for retransmission to the initiator', async done => {
          const answer = await receiver.answer(webRTCOffer)
          const message = { data: answer }
          receiver.send(signals.answerSignal, message)
          initiator.on(signals.answer, async data => {
            webRTCAnswer = await initiator.decrypt(data.data)
            const expectedVersionProperties = ['type', 'sdp']
            expect(Object.keys(webRTCAnswer)).toEqual(
              expect.arrayContaining(expectedVersionProperties)
            )
            done()
          })
        })
      })
    })
  })

  /*
  ===================================================================================
    4. Pairing -> WebRTC Connection
  ===================================================================================
  */
  describe('RTC Connection', () => {
    /*
    ===================================================================================
      4a. Pairing -> RTC Connection -> RTC Connection [Initiator & Receiver]
    ===================================================================================
    */
    describe('RTC Connection [Initiator & Receiver] ', () => {
      /*
      ===================================================================================
        4a. Pairing -> RTC Connection -> RTC Connection [Initiator & Receiver] -> SUCCESS
      ===================================================================================
      */
      describe('<SUCCESS>', () => {
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
    })
    /*
    ===================================================================================
      4b. Pairing -> RTC Connection -> RtcConnected [Initiator → Server]
    ===================================================================================
    */
    describe('RtcConnected [Initiator & Receiver → Server]', () => {
      /*
      ===================================================================================
        4b. Pairing -> RTC Connection -> RtcConnected [Initiator → Server] -> SUCCESS
      ===================================================================================
      */
      describe('<SUCCESS>', () => {
        it('Should inform SignalServer of successful RTC connection', async done => {
          initiator.send(signals.rtcConnected)
          initiator.on(signals.disconnect, data => {
            done()
          })
        })
      })
    })
    /*
    ===================================================================================
      4b. Pairing -> RTC Connection -> RtcConnected [Receiver → Server]
    ===================================================================================
    */
    describe('RtcConnected [Receiver & Receiver → Server]', () => {
      /*
      ===================================================================================
        4b. Pairing -> RTC Connection -> RtcConnected [Receiver → Server] -> SUCCESS
      ===================================================================================
      */
      describe('<SUCCESS>', () => {
        it('Should inform SignalServer of successful RTC connection', async done => {
          receiver.send(signals.rtcConnected)
          receiver.on(signals.disconnect, data => {
            done()
          })
        })
      })
    })
  })
})

// describe('Initial Connection', () => {

//   beforeAll(async done => {
//     // Initiator //
//     initiator = new Initiator()
//     initiator.generateKeys()

//     // Receiver //
//     receiver = new Receiver()
//     receiver.setKeys(initiator.publicKey, initiator.privateKey, initiator.connId)

//     done()
//   })

//   it('Should connect initiator', async done => {
//     await initiator.connect(websocketURL)
//     initiator.on(signals.initiated, data => {
//       done()
//     })
//   })

//   it('Should connect receiver', async done => {
//     await receiver.connect(websocketURL)
//     receiver.on(signals.confirmation, data => {
//       done()
//     }) 
//   })

//   it('Should send offer', async done => {
//     const offer = await initiator.offer()
//     const encryptedOffer = await initiator.encrypt(offer)

//     const data = {
//       data: encryptedOffer,
//       options: stunServers
//     }
//     initiator.send(signals.offerSignal, data)
//     receiver.on(signals.offer, async data => {
//       webRTCOffer = await receiver.decrypt(data.data)
//       done()
//     })

//   })

//   it('Should send answer', async done => {
//     const answer = await receiver.answer(webRTCOffer)
//     const encryptedAnswer = await receiver.encrypt(answer)

//     const data = {
//       data: encryptedAnswer
//     }

//     receiver.send(signals.answerSignal, data)
//     initiator.on(signals.answer, async data => {
//       webRTCAnswer = await initiator.decrypt(data.data)
//       done()
//     })
//   })

//   it('Should establish RTC connection between the initiator and receiver', async done => {
//     initiator.signal(webRTCAnswer)

//     const initiatorPromise = new Promise((resolve, reject) => {
//       initiator.onRTC(rtcSignals.connect, resolve)
//     })

//     const receiverPromise = new Promise((resolve, reject) => {
//       receiver.onRTC(rtcSignals.connect, resolve)
//     })

//     await Promise.all([
//       initiatorPromise,
//       receiverPromise
//     ])

//     done()
//   }) 

// })