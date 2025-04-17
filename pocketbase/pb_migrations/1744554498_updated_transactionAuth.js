/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2156879558")

  // update collection data
  unmarshal({
    "createRule": null,
    "listRule": "(@request.auth.id != \"\" && transaction.ausschuss.users.id ?= @request.auth.id) || @request.auth.isPruefer = true",
    "viewRule": "(@request.auth.id != \"\" && transaction.ausschuss.users.id ?= @request.auth.id) || @request.auth.isPruefer = true"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2156879558")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" && transaction.id ?= @collection.transaction.id",
    "listRule": "@request.auth.id != \"\" && transaction.ausschuss.users.id ?= @request.auth.id",
    "viewRule": "@request.auth.id != \"\" && transaction.ausschuss.users.id ?= @request.auth.id"
  }, collection)

  return app.save(collection)
})
