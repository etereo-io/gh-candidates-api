const fs = require('fs')
const axios = require('axios')
const cheerio = require('cheerio')

const { promisify } = require('util')

const readFileAsync = promisify(fs.readFile)
const writeFileAsync = promisify(fs.writeFile)

const helpers = require('./helpers')

const APIURL = 'https://api.github.com'
const USERS_URL = `${APIURL}/search/users`
const TOKEN = 'token ' // add your token: 'token <token>'

let results = []
let userList = []

function fetchResults() {
  return readFileAsync('./results.json', {encoding: 'utf8'}).then((data) => {
    results = JSON.parse(data)
  })
}

function filterResults(user) {
  return results.filter((i) => i.login === user.login).length > 0

}
function fetchUserContributions(user) {

  if (filterResults(user)) {
    return Promise.reject()
  }
  const url = `https://github.com/users/${user.login}/contributions`

  return axios.get(url)
    .then(response => {
      const $ = cheerio.load(response.data)
      const elements = $('rect[data-count]')
      const contributions = []
      elements.each((i, el) => {
        contributions.push(parseInt(el.attribs['data-count']))
      })
      user.contributions = contributions.reduce((a, b) => a + b, 0)
      return user
    })
    .catch((err) => { console.log(err) })
}

function fetchUsersContributions(users) {
  const promises = users.map((user) => fetchUserContributions(user))
  return Promise.all(promises.map(helpers.reflect))
    .then((data) => data.filter((i) => i.status === 'resolved')
      .map((e) => e.data)
    )
}


function fetchAllPages(page = 1, location) {
  const q = helpers.buildQueryString({ location })
  const headers = { Authorization: TOKEN }
  const params = { per_page: 100, page }
  const options = { headers, params }
  const url = `${USERS_URL}?q=${q}`
  return fetchResults().then(() => {
    return axios.get(url, options)
      .then((res) => {
        const linkHeader = res.headers.link
        res.data.items.forEach((user) => {
          userList.push({ login: user.login })
        })
        if (params.page <= helpers.getTotalPages(linkHeader)) {
          return fetchAllPages(helpers.getNextPage(linkHeader))
        }
        return fetchUsersContributions(userList)
      })
  })
}

function getUsersData() {
  userList = []
  results = []
  console.log('Fetching everything...')
  const cities = ['Madrid','Alcalá de Henares','Alcorcón','Getafe','Leganés','Móstoles','Fuenlabrada','Torrejón de Ardoz','Parla', 'Alcobendas','Las Rozas','Coslada','San Sebastián de los Reyes','Pozuelo de Alarcón','Rivas-Vaciamadrid','Valdemoro','Majadahonda','Collado Villalba','Aranjuez','Arganda del Rey']

  const promises = cities.map((city) => fetchAllPages(1, city))
  return Promise.all(promises.map(helpers.reflect))
    .then((data) => data.filter((i) => i.status === 'resolved')
      .map((e) => e.data))
    .then((response) => {
      response.forEach((promiseResult) => {
        results.push(...promiseResult)
      })
      return writeFileAsync('results.json', JSON.stringify(results), 'utf8').then(() => {
        console.log('all done!', results)
        return results
      })
        .catch(helpers.logError)
    })
}

module.exports = {
  getUsersData
}
