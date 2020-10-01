import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const XAWS = AWSXRay.captureAWS(AWS)
const s3 = new XAWS.S3({signatureVersion: 'v4'})

import { BookItem } from '../models/BookItem'
import { BookUpdate } from '../models/BookUpdate'

export class BookAccess {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly bookTable = process.env.BOOK_TABLE,
    private readonly bookIndexTable = process.env.USER_ID_INDEX,
    private readonly urlExpiration = process.env.URL_EXPIRATION,
    private readonly imagesS3Bucket = process.env.IMAGES_S3_BUCKET

    ) { }

  async getUserBooks(userId: String): Promise<BookItem[]> {
    console.log('Getting all Books for user', userId)

    const result = await this.docClient.query({
        TableName: this.bookTable,
        IndexName: this.bookIndexTable,
        ProjectionExpression: "bookId, createdAt, title, author, rating, done, attachmentUrl, review",
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        },
        ScanIndexForward: false,
    }).promise()


    const items = result.Items
    return items as BookItem[]
  }

  async createBook(bookItem: BookItem): Promise<BookItem> {
    console.log('Create Book Item ', bookItem)

    await this.docClient.put({
        TableName: this.bookTable,
        Item: bookItem
        }).promise()

    return bookItem
    }

    async updateBook(bookId: string, userId: string, bookUpdate: BookUpdate){
        console.log('Update Book Item ', bookId, bookUpdate)

        const param = {
            TableName: this.bookTable,
            Key: { 
                "bookId": bookId, 
                "userId": userId 
            },
            UpdateExpression: "set title = :title, author = :author, rating = :rating, done = :done, review = :review",
            ExpressionAttributeValues: {
                ":title": bookUpdate.title,
                ":author": bookUpdate.author,
                ":rating": bookUpdate.rating,
                ":done": bookUpdate.done,
                ":review": bookUpdate.review
            },
            ReturnValues: "UPDATED_NEW"
        }

        return await this.docClient.update(param).promise()
    }

    async updateBookUrl(bookId: string, userId: string){
        const attachmentUrl = `https://${this.imagesS3Bucket}.s3.amazonaws.com/${bookId}`
    
        console.log('Update book Url ', bookId, userId, attachmentUrl)

        const param = {
            TableName: this.bookTable,
            Key: { 
                "bookId": bookId, 
                "userId": userId 
            },
            UpdateExpression: "set attachmentUrl = :attachmentUrl",
            ExpressionAttributeValues: {
                ":attachmentUrl": attachmentUrl,
            },
            ReturnValues: "UPDATED_NEW"
        }

        return await this.docClient.update(param).promise()
    }

    async deleteBook(bookId: string, userId: string){
        console.log('Delete book Item ', bookId)

        return await this.docClient.delete({
            TableName: this.bookTable,
            Key: { 
                "bookId": bookId, 
                "userId": userId 
            },
            }).promise()
    }

    getSignedUrl(bookId: string){
        console.log('Get Signed URL for book Item ', bookId)

        return s3.getSignedUrl('putObject', {
                    Bucket: this.imagesS3Bucket,
                    Key: bookId,
                    Expires: Number(this.urlExpiration)
                    })
                }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}
