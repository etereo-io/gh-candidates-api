const fs = require('fs')
const axios = require('axios')
const cheerio = require('cheerio')

const helpers = require('./helpers')

const APIURL = 'https://api.github.com'
const USERS_URL = `${APIURL}/search/users`
const TOKEN = 'token 216e0730050e991db9f452e0f6d07f77aa6f2959'

let userList = []

function fetchUserContributions(login) {
  const url = `https://github.com/users/${login}/contributions`

  return axios.get(url)
    .then(response => {
      const $ = cheerio.load(response.data)
      const elements = $('rect[data-count]')
      const contributions = []

      elements.each((i, el) => {
        contributions.push(parseInt(el.attribs['data-count']))
      })

      return { login, contributions: contributions.reduce((a, b) => a + b, 0) }
    })
}

function fetchUsersContributions(users) {
  const promises = users.map((user) => fetchUserContributions(user.login))
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
  return axios.get(url, options)
    .then((res) => {
      const linkHeader = res.headers.link
      res.data.items.forEach((user) => {
        userList.push({ login: user.login, html_url: user.html_url })
      })
      if (params.page <= helpers.getTotalPages(linkHeader)) {
        return fetchAllPages(helpers.getNextPage(linkHeader))
      }
      return fetchUsersContributions(userList)
    })
}

function getUsersData() {
  userList = []
  return fetchAllPages()
    .then((response) => {
      fs.writeFile('results.json', JSON.stringify(response), 'utf8', () => {
        console.log('all done!')
      })
    })
    .catch(helpers.logError)
}

getUsersData()
