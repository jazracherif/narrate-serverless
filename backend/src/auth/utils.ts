import { decode } from 'jsonwebtoken'

import { JwtPayload } from './JwtPayload'

/**
 * Parse a JWT token and return a user id
 * @param jwtToken JWT token to parse
 * @returns a user id from the JWT token
 */

export function parseUserId(jwtToken: string): string {
  const decodedJwt = decode(jwtToken) as JwtPayload
  
  /* Replace | with * because we sometimes write S3 objects
    with userId as the key and | is not recommended.
  */
  return decodedJwt.sub.replace("|", "*")
}

