'use strict'

import Schema from 'validate'

const wholeEncrypted = ['answersignal', 'offersignal']
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
      required: false,
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

const validateSignal = async message => {
  const signal = message.signal
  const data = message.data
  return new Promise((resolve, reject) => {
    let errors
    if (wholeEncrypted.includes(signal)) {
      errors = encryptedValidator.validate(data)
    } else if (signal === signature) {
      errors = signatureValidator.validate(data)
    } else if (signal === rtcConnected) {
      errors = rtcConnectedValidator.validate(data)
    } else if (signal === tryTurn) {
      errors = tryTurnValidator.validate(data)
    } else {
      reject(errors)
    }

    if (data.options !== undefined && data.options !== null) {
      if (!optionsCheck(data.options)) {
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
