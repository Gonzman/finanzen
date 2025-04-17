/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
    // e.app
    //e.record.id

    let collection = $app.findCollectionByNameOrId("transactionAuth");
    let record = new Record(collection);
    record.set("transaction", e.record.id);
    record.set("state", "Ausstehend");
    $app.save(record)
    e.next()
}, "transaction")