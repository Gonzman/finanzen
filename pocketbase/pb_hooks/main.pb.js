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


onRecordUpdateRequest((e) => {
    // Get the acceptedby field value
    const acceptedby = e.record.get("acceptedby");
    console.log("Accepted by:", acceptedby);
    
    // Check if acceptedby is an array and has 2 or more entries
    if (Array.isArray(acceptedby) && acceptedby.length >= 2) {
        // Update the state to "Autorisiert"
        e.record.set("state", "Autorisiert");
    }
    
    e.next();
}, "transactionAuth")