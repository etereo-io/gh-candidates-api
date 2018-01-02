function getTotalPages(linkHeader) {
  if (typeof linkHeader === 'undefined') {
    return 1
  }
  const link = linkHeader.split(',').find(i => i.indexOf('last'))
  return link.substring(link.lastIndexOf('page=') + 5, link.lastIndexOf('>'))
}

function getNextPage(linkHeader) {
  if (typeof linkHeader === 'undefined') {
    return 1
  }
  const link = linkHeader.split(',').find(i => i.indexOf('next'))
  return link.substring(link.lastIndexOf('page=') + 5, link.lastIndexOf('>'))
}

function buildQueryString(queryParams) {
  let qs = ' '
  Object.keys(queryParams).forEach((param) => {
    const paramToStr = `${param}:${queryParams[param]}`
    if (qs.length > 0) {
      qs += `+${paramToStr}`
    } else {
      qs += queryParams[param]
    }
  })
  return qs
}

function logError(err) {
  console.log('Error', err.response.status)
  return err
}

function reflect(promise){
  return promise.then((data) => ({ data, status: 'resolved' }),
    (data) => ({data, status: 'rejected' }))
}

module.exports = {
  getNextPage,
  getTotalPages,
  buildQueryString,
  logError,
  reflect
}
