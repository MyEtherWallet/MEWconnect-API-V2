'use strict'

import { roles } from '@util/signals'

const validConnId = string => {
  let validHex = /[0-9A-Fa-f].*/.test(string)
  let validLength = string.length === 32
  let result = validHex && validLength
  return result
}

const validHex = string => {
  let validHex = /[0-9A-Fa-f].*/.test(string)
  return validHex
}

const validRole = string => {
	return (string === roles.initiator || string === roles.receiver)
}

export { validConnId, validHex, validRole }
