'use strict'

import Schema from 'validate'

const wholeEncrypted = ['answerSignal', 'offerSignal']
const signature = 'signature'
const rtcConnected = 'rtcConnected'
const tryTurn = 'tryTurn'

const optionsCheck = opts => {
  if (typeof opts === 'string') {
    return true
  } else if (typeof opts === 'number') {
    return false
  } else if (typeof opts === 'object') {
    return true
  } else {
    return false
  }
}

const rtcConnectedValidator = new Schema({
  type: String,
  required: true
})
const signatureValidator = new Schema({
  signed: {
    type: String,
    required: true
  },
  connId: {
    type: String,
    required: true,
    length: { min: 32, max: 32 }
  },
  version: {
    iv: {
      type: {
        type: String,
        required: true
      },
      data: {
        type: Array,
        required: true
      }
    },
    ephemPublicKey: {
      type: {
        type: String,
        required: true
      },
      data: {
        type: Array,
        required: true
      }
    },
    ciphertext: {
      type: {
        type: String,
        required: true
      },
      data: {
        type: Array,
        required: true
      }
    },
    mac: {
      type: {
        type: String,
        required: true
      },
      data: {
        type: Array,
        required: true
      }
    }
  }
})
const encryptedValidator = new Schema(
  {
    data: {
      iv: {
        type: {
          type: String,
          required: true
        },
        data: {
          type: Array,
          required: true,
          length: 16
        }
      },
      ephemPublicKey: {
        type: {
          type: String,
          required: true
        },
        data: {
          type: Array,
          required: true,
          length: 65
        }
      },
      ciphertext: {
        type: {
          type: String,
          required: true
        },
        data: {
          type: Array,
          required: true
        }
      },
      mac: {
        type: {
          type: String,
          required: true
        },
        data: {
          type: Array,
          required: true,
          length: 32
        }
      }
    },
    connId: {
      type: String,
      required: true,
      length: { min: 32, max: 32 }
    }
  },
  { strip: false }
)

const tryTurnValidator = new Schema({
  connId: {
    type: String,
    required: true,
    length: { min: 32, max: 32 }
  },
  cont: {
    type: Boolean
  }
})

const validateSignal = message => {
  return new Promise((resolve, reject) => {
    let errors
    if (wholeEncrypted.includes(message[0])) {
      errors = encryptedValidator.validate(message[1])
    } else if (message[0] === signature) {
      errors = signatureValidator.validate(message[1])
    } else if (message[0] === rtcConnected) {
      errors = rtcConnectedValidator.validate(message[1])
    } else if (message[0] === tryTurn) {
      errors = tryTurnValidator.validate(message[1])
    } else {
      reject(errors)
    }

    if (message[1].options !== undefined && message[1].options !== null) {
      if (!optionsCheck(message[1].options)) {
        if (!errors) errors = []
        errors.push('Invalid Options Field')
      }
    }

    if (errors.length > 0) {
      reject(errors)
    } else {
      resolve()
    }
  })
}

export { validateSignal }
