const fs = require('fs')
const { db } = require('../src/util/firebase')
const schema = require('./schema')

const json2firestore = (_JSON, db, schema) => {
  return Promise.all(
    Object.keys(schema).map(collection => {
      let promises = []
      Object.keys(_JSON[collection]).map(_doc => {
        const doc_id = _doc
        if (_doc === '__type__') return
        let doc_data = Object.assign({}, _JSON[collection][_doc])
        Object.keys(doc_data).map(_doc_data => {
          if (doc_data[_doc_data] && doc_data[_doc_data].__type__) delete doc_data[_doc_data]
        })
        promises.push(
          db
            .collection(collection)
            .doc(doc_id)
            .set(doc_data)
            .then(() => {
              return json2firestore(
                _JSON[collection][_doc],
                db.collection(collection).doc(doc_id),
                schema[collection]
              )
            })
        )
      })
      return Promise.all(promises)
    })
  )
}

json2firestore(
  JSON.parse(fs.readFileSync('./db/local.json', 'utf8')),
  db(),
  { ...schema }
).then(() => console.log('done'))
