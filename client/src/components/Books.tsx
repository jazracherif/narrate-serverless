import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader
} from 'semantic-ui-react'

import { createBook, deleteBook, getBooks, patchBook } from '../api/books-api'
import Auth from '../auth/Auth'
import { Book } from '../types/Book'
import StarRatingComponent from 'react-star-rating-component';

interface BooksProps {
  auth: Auth
  history: History
}

interface BooksState {
  books: Book[]
  newBookTitle: string
  newBookAuthor: string
  newBookRating: number
  loadingBooks: boolean
}

export class Books extends React.PureComponent<BooksProps, BooksState> {
  state: BooksState = {
    books: [],
    newBookTitle: '',
    newBookAuthor: '',
    newBookRating: 0,
    loadingBooks: true
  }

  handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newBookTitle: event.target.value })
  }

  handleAuthorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newBookAuthor: event.target.value })
  }

  onEditButtonClick = (bookId: string) => {
    this.props.history.push(`/Books/${bookId}/edit`)
  }

  onBookCreate = async (event: React.MouseEvent<HTMLButtonElement>) => {
    try {
      const newBook = await createBook(this.props.auth.getIdToken(), {
        title: this.state.newBookTitle,
        author: this.state.newBookAuthor,
        rating: this.state.newBookRating
      })
      this.setState({
        books: [...this.state.books, newBook],
        newBookTitle: ''
      })
    } catch {
      alert('Book creation failed')
    }
  }

  onBookDelete = async (bookId: string) => {
    try {
      await deleteBook(this.props.auth.getIdToken(), bookId)
      this.setState({
        books: this.state.books.filter(book => book.bookId != bookId)
      })
    } catch {
      alert('Book deletion failed')
    }
  }

  
  onBookCheck = async (pos: number) => {
    try {
      const book = this.state.books[pos]
      await patchBook(this.props.auth.getIdToken(), book.bookId, {
        title: book.title,
        author: book.author,
        done: !book.done,
        rating: book.rating
      })
      this.setState({
        books: update(this.state.books, {
          [pos]: { done: { $set: !book.done } }
        })
      })
    } catch {
      alert('Book Update failed')
    }
  }

  onBookRatingUpdate = async (value: number, pos: number) => {
    try {
      const book = this.state.books[pos]
      await patchBook(this.props.auth.getIdToken(), book.bookId, {
        title: book.title,
        author: book.author,
        done: !book.done,
        rating: value
      })
      this.setState({
        books: update(this.state.books, {
          [pos]: { rating: { $set: value} }
        })
      })
    } catch {
      alert('Book Update failed')
    }
  }

  async componentDidMount() {
    try {
      const books = await getBooks(this.props.auth.getIdToken())
      this.setState({
        books,
        loadingBooks: false
      })
    } catch (e) {
      alert(`Failed to fetch Books: ${e.message}`)
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">Books</Header>

        {this.renderCreateBookInput()}

        {this.renderBooks()}
      </div>
    )
  }

  renderCreateBookInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
            Book Title:
          <Input
            fluid
            actionPosition="left"
            placeholder="Moby Dick"
            onChange={this.handleTitleChange}
          />
        </Grid.Column>
        <Grid.Column width={16}>
            Book Author:
          <Input
            fluid
            actionPosition="left"
            placeholder="Herman Melville"
            onChange={this.handleAuthorChange}
          />
        </Grid.Column>
        <Button color= 'teal'
                content= 'Add New Book'
                onClick= {this.onBookCreate}>
        </Button>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
      
    )
  }

  renderBooks() {
    if (this.state.loadingBooks) {
      return this.renderLoading()
    }

    return this.renderBooksList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading Books
        </Loader>
      </Grid.Row>
    )
  }

  renderBooksList() {
    return (
      <Grid padded>
        {this.state.books.map((book, pos) => {
          return (
            <Grid.Row key={book.bookId}>
              <Grid.Column width={1} verticalAlign="middle">
                {<Checkbox
                  onChange={() => this.onBookCheck(pos)}
                  checked={book.done}></Checkbox>
                }
              </Grid.Column>               
              <Grid.Column width={2} verticalAlign="middle">  
                { 
                <StarRatingComponent
                    value={book.rating}
                    onStarClick={(nextValue, prevValue, name) => this.onBookRatingUpdate(nextValue, pos)}
                    starCount={5}
                    emptyStarColor='grey'
                    name='rating'
                 />
                }
              </Grid.Column>
              <Grid.Column width={4} verticalAlign="middle">
                {book.title}
              </Grid.Column>
              <Grid.Column width={4} verticalAlign="middle">
                {book.author}
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="blue"
                  onClick={() => this.onEditButtonClick(book.bookId)}
                >
                  <Icon name="pencil" />
                </Button>
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="red"
                  onClick={() => this.onBookDelete(book.bookId)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>
              {/* {book.attachmentUrl && (
                 <embed src={book.attachmentUrl}/>
              )} */}
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

}
