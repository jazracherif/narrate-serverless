import { SNSEvent, SNSHandler, S3EventRecord } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { createBook } from '../../businessLogic/books'
const csvParser = require('csv-parse');
const stream = require('stream');
 
const XAWS = AWSXRay.captureAWS(AWS)

const s3 = new XAWS.S3()

const libraryBucketName = process.env.GOODREAD_LIBRARY_S3_BUCKET

export const handler: SNSHandler = async (event: SNSEvent) => {
  console.log('Processing SNS event ', JSON.stringify(event))
  for (const snsRecord of event.Records) {
    const s3EventStr = snsRecord.Sns.Message
    console.log('Processing S3 event', s3EventStr)
    const s3Event = JSON.parse(s3EventStr)

    for (const record of s3Event.Records) {
        await processLibraryFile(record)
    }
  }
}

async function processLibraryFile(record: S3EventRecord) {
    console.log(record)
    const key = record.s3.object.key
    console.log('Processing S3 item with bucket/key: ', libraryBucketName, key)

    const response = await s3
        .getObject({
            Bucket: libraryBucketName,
            Key: key
            })
            .promise()

    var s3Stream = new stream.Readable(); 
    s3Stream._read = () => {}; 
    s3Stream.push(response.Body);
     
    const parser = s3Stream.pipe(csvParser({columns: true}))
          
    for await (const record of parser) {
        const title = record["Title"]
        const author = record["Author"]
        const rating = Number(record["My Rating"])
        const review = record["My Review"]
        console.log("add Book", title, author, rating, review)
        
        await createBook(key,
                         title,
                         author,
                         rating,
                         review)
    }            
}

// async function processImage2(record: S3EventRecord) {
//     const key = record.s3.object.key
//     console.log('Processing S3 item with bucket/key: ', libraryBucketName, key)
  
//     let s3Stream = s3.getObject({
//                 Bucket: libraryBucketName,
//                 Key: key
//                 }).createReadStream();
     
//     const parser = s3Stream.pipe(csvParser({columns: true}))
          
//     for await (const record of parser) {
//         const title = record["Title"]
//         const author = record["Author"]
//         const rating = Number(record["My Rating"])
//         const review = record["My Review"]
//         console.log("add Book", title, author, rating, review)

//         await createBook(key,
//                          title,
//                          author,
//                          rating,
//                          review)
//     }
// }