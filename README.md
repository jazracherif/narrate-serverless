# Book List Application

This application allows one to maintain their book list, reading progress, ratings and book reviews. It also allows one to import their goodreads library.


## Functionality

The backend application allows creating/removing/updating and fetching Book items. Each user only has access to Book items that he/she has created and must be authenticated before using the application

The application keeps track of books items, and each book item contains the following fields:

* `bookId` (string) - a unique id for a book item
* `createdAt` (string) - date and time when an item was created
* `title` (string) - The title of a book item (e.g. "Moby Dick")
* `Author` (string) - The author of a book item (e.g. "Herman Melville")
* `rating` (string) - The user rating given to a book
* `done` (boolean) - true if a book is marked as read, false otherwise
* `review` (string) - The user review 


## Implementation

The core of the backend application is implemented using AWS serverless functions, backed by a dynamoDB storage, and a Simple Notification Service (SNS) for handing asynchronously the importation of a Goodreads library. Access to the backend is through AWS API Gateway.

The following APIs are implemented:

* `Auth` - this function implements a custom authorizer for API Gateway that is used by all functions requiring authentication.

* `GetBooks` -  returns all books for a current user. A user id is extracted from a JWT token that is sent by the frontend using the [auth0](https://auth0.com) service

It returns data that looks like this:

```json
{
    "items": [
        {
            "bookId": "ef7e8eaf-98d3-4597-a6cd-88a90047398b",
            "rating": 4,
            "attachmentUrl": "",
            "createdAt": "2020-10-03T04:44:48.307Z",
            "review": "Great Book",
            "done": true,
            "author": "R.R. Palmer",
            "title": "The Age of the Democratic Revolution: A Political History of Europe & America 1760-1800"
        },
        {
            "bookId": "029320ea-b55e-4680-84a6-f141cd6bee4f",
            "rating": 0,
            "attachmentUrl": "",
            "createdAt": "2020-10-03T04:44:50.562Z",
            "review": "",
            "done": false,
            "author": "Frederick Schauer",
            "title": "Thinking Like a Lawyer: A New Introduction to Legal Reasoning"
        }
    ]
}
```

* `CreateBook` -  creates a new Book for a current user. A shape of data send by a client application to this function can be found in the `backend/src/models/create-book-request.json` file

Example Request:
```json
{
	"title": "Moby Dick",
	"author": "Herman Melville",
	"rating": 0,
	"review": ""
}
```

Example Response:

```json
{
    "item": {
        "bookId": "df2e2858-6231-4760-a4e4-691fd0649216",
        "createdAt": "2020-10-05T20:07:28.516Z",
        "title": "Moby Dick",
        "author": "Herman Melville",
        "rating": 0,
        "done": false,
        "attachmentUrl": "",
        "review": ""
    }
}
```

* `UpdateBook` -  updates a Book item created by a current user. A shape of data send by a client application to this function can be found in the `backend/src/models/update-book-request.json` file

Example Request:

```json
{
	"title": "Moby Dick",
	"author": "Herman Melville",
	"rating": 1,
	"done": true,
	"review": ""
}
```

The id of an item that should be updated is passed as a URL parameter.

It should return an empty body.

* `DeleteBooks` -  deletes a Book item created by a current user. Expects an id of a Book item to remove.

It should return an empty body.

* `GenerateUploadLibraryUrl` - returns a pre-signed URL that can be used to upload a goodreads library list.

It returns a JSON object that looks like this:

```json
{
  "uploadUrl": "https://book-app-goodreads-bucket-dev.s3.amazonaws.com/..."
}
```

### Good Read library import

It is possible to ingest a goodread library into one's own account. In order to do so, the client app will need to get a signed URL using the above API and upload a `.csv` file that corresponds to an exported goodreads library (see instructions [here](https://help.goodreads.com/s/article/How-do-I-import-or-export-my-books-1553870934590))

One the file is uploaded onto S3, it will generate a notification record and send it to AWS SNS queue, which will then be picked up by a separate lambda function for consumption. This function will iterate over every item in the `.csv` file and add the item to dynamoDB.

An example file has been provided under `goodreads_library_export.csv` to test this functionality. The frontend provide a `import goodreads library` button for this purpose.

## Frontend

The `client` folder contains a web application that uses the API above to provide the user interface for management the book list.

This frontend relies on the `config.ts` file in the `client/src` folder to find out about the API Endpoint and the auth0 credentials.

### Authentication

An auth0 domain has been created to handle authentication for this application. The implementation of the interactions with auth0 are implemented in `client/src/auth/Auth.js`


## How to run the application

### Backend

To deploy an application run the following commands:

```
cd backend
npm install
sls deploy -v
```

### Frontend

To run a client application first edit the `client/src/config.ts` file to set correct parameters. And then run the following commands:

```
cd client
npm install
npm run start
```

This should start a development server with the React application that will interact with the serverless Book application.

It is also possible to deploy the client onto AWS S3 bucket using the `serverless.yml` file in the `client` folder

```
cd client
npm run build
sls client deploy -v
```

## Postman collection

A postman file has also been included for API integration tests. See `Narrate Serverless - Book Management.postman_collection` and follow the below instruction for loading the file

Click on the import button:

![Alt text](images/import-collection-1.png?raw=true "Image 1")


Click on the "Choose Files":

![Alt text](images/import-collection-2.png?raw=true "Image 2")


Select a file to import:

![Alt text](images/import-collection-3.png?raw=true "Image 3")


Right click on the imported collection to set variables for the collection:

![Alt text](images/import-collection-4.png?raw=true "Image 4")

Provide variables for the collection (similarly to how this was done in the course):

![Alt text](images/import-collection-5.png?raw=true "Image 5")


## Improvements

There are several improvements for the projects:
- For large book lists, implement pagination to get list of books incrementally.
- Add Additional checks for the goodreads imports, specially checking a valid file has been submitted.
- Only import from goodreads those books that haven't already been imported
- Add additional unittests for validating the backend businessLogic and dataLayer components. 