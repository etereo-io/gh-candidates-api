const fs = require('fs')
const axios = require('axios')
const cheerio = require('cheerio')

const { promisify } = require('util')

const readFileAsync = promisify(fs.readFile)
const writeFileAsync = promisify(fs.writeFile)

const helpers = require('./helpers')

const APIURL = 'https://api.github.com'
const USERS_URL = `${APIURL}/search/users`
const TOKEN = 'token 69ff11ab824cf41058d21cc99b7d48a4b3e1f73d'

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
      console.log(user)
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


function fetchAllPages(page = 1) {
  const q = helpers.buildQueryString({ location: 'Madrid' })
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
  return fetchAllPages()
    .then((response) => {
      results.push(...response)
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
