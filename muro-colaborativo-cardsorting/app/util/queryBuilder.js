class Query {
  parseValue(value) {
    return typeof value === 'string' ? `'${value}'` : value
  }

  whereEquals(map) {
    this.whereList = Object.entries(map).map(([k, v]) => [k, '=', v])
    return this
  }

  where(column, operator, value) {
    this.where = [column, operator, value]
    return this
  }

  build() {
    return this.toString()
  }
}

class Select extends Query {
  columns = []
  table = ''
  whereList = []

  constructor(columns) {
    super()
    this.columns = columns
  }

  from(table) {
    this.table = table
    return this
  }

  toString() {
    const whereClause = this.whereList.length
      ? `WHERE ${this.whereList
        .map((w) => `${w[0]} ${w[1]} ${this.parseValue(w[2])}`)
        .join(' AND ')};`
      : ';'
    return `SELECT ${this.columns.join(', ')} FROM ${this.table} ${whereClause}`
  }
}

class Update extends Query {
  table = ''
  setMap = []
  whereList = []

  constructor(table) {
    super()
    this.table = table
  }

  set(map) {
    this.setMap = map
    return this
  }

  returning(columns) {
    this.returningList = columns
    return this
  }

  toString() {
    const setClause = Object.entries(this.setMap)
      .map(([k, v]) => `${k} = ${this.parseValue(v)}`)
      .join(', ')
    const whereClause = this.whereList.length
      ? `WHERE ${this.whereList
        .map((w) => `${w[0]} ${w[1]} ${this.parseValue(w[2])}`)
        .join(' AND ')}`
      : ''
    const returningClause = this.returningList
      ? `RETURNING ${this.returningList.join(', ')};`
      : ';'
    // eslint-disable-next-line max-len
    return `UPDATE ${this.table} SET ${setClause} ${whereClause} ${returningClause}`
  }
}

module.exports = { Select, Update }
