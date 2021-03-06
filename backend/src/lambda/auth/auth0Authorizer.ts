import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'

import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

import Axios from 'axios'


const logger = createLogger('auth')

// URL that can be used to download a certificate that can be used
// to verify JWT token signature. 
// From Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://jazra.us.auth0.com/.well-known/jwks.json'


export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  // Essentially follows instructions from https://auth0.com/blog/navigating-rs256-and-jwks/

  // Get the certificate that contain the right key ID
  const rsp = await Axios.get(jwksUrl)
  const keys = rsp.data.keys

  console.log("keys", keys)
  if (!keys || !keys.length) {
      throw "Not keys Available"
  }

  const signingKeys = keys
        .filter(key => key.use === 'sig' // JWK property `use` determines the JWK is for signature verification
                    && key.kty === 'RSA' // We are only supporting RSA (RS256)
                    && key.kid           // The `kid` must be present to be useful for later
                    && ((key.x5c && key.x5c.length) || (key.n && key.e)) // Has useful public keys
        ).map(key => {
          return { kid: key.kid, nbf: key.nbf, publicKey: certToPEM(key.x5c[0]) };
        });

  console.log("signingKeys", signingKeys)
  if (!signingKeys.length) {
      throw "No Available Signing Key"
  }

  // Find the right key
  const signingKey = signingKeys.find(key => key.kid === jwt.header.kid);
  console.log("signingKey", signingKey)

  return verify(token, signingKey.publicKey, { algorithms: ['RS256'] }) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

function certToPEM(cert) {
    cert = cert.match(/.{1,64}/g).join('\n');
    cert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`;
    return cert;
 }