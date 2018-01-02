const express = require('express')
const app = express()
const port = 3000

const API = require('./index')

app.get('/candidates', (request, response) => {
  API.getUsersData().then((res) => {
    response.send(res)
  })
  .catch((err) => {
    console.log(err)
    response.status(500).send(err)
  })
})

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})
