function sortByTitle(tasks) {
  tasks.sort((a, b) =>
    a.status.name.localeCompare(b.status.name, 'th', { sensitivity: 'base' })
  )
}
function sortByTitleReverse(tasks) {
  tasks.sort((a, b) =>
    b.status.name.localeCompare(a.status.name, 'th', { sensitivity: 'base' })
  )
}
function sortByTitleDate(tasks) {
  tasks.sort((a, b) => a.id - b.id)
}

function searchByStatus(items, keywords) {
  const lowerCaseKeywords = keywords.toLowerCase()
  items.filter(
    (items) =>
      items.id.toString().includes(lowerCaseKeywords) ||
      items.title.toLowerCase().includes(lowerCaseKeywords) ||
      items.assignees.includes(lowerCaseKeywords) ||
      items.status.name.toLowerCase().includes(lowerCaseKeywords)
  )
}
export { sortByTitle, sortByTitleReverse, sortByTitleDate, searchByStatus }
