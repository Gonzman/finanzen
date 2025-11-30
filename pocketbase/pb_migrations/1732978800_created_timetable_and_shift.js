/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    // Create timetable collection
    const timetable = new Collection({
        name: 'timetable',
        type: 'base',
        schema: [
            {
                name: 'name',
                type: 'text',
                required: true,
            },
            {
                name: 'ausschuss',
                type: 'relation',
                required: true,
                options: {
                    collectionId: app.findCollectionByNameOrId('ausschuss').id,
                    cascadeDelete: false,
                    maxSelect: 1,
                    displayFields: ['name'],
                },
            },
            {
                name: 'createdby',
                type: 'relation',
                required: true,
                options: {
                    collectionId: app.findCollectionByNameOrId('users').id,
                    cascadeDelete: false,
                    maxSelect: 1,
                    displayFields: ['name'],
                },
            },
        ],
        listRule: '@request.auth.id != "" && ausschuss.users.id ?= @request.auth.id',
        viewRule: '@request.auth.id != "" && ausschuss.users.id ?= @request.auth.id',
        createRule: '@request.auth.id != "" && ausschuss.users.id ?= @request.auth.id',
        updateRule: '@request.auth.id != "" && createdby = @request.auth.id',
        deleteRule: '@request.auth.id != "" && createdby = @request.auth.id',
    });

    app.save(timetable);

    // Create shift collection
    const shift = new Collection({
        name: 'shift',
        type: 'base',
        schema: [
            {
                name: 'timetable',
                type: 'relation',
                required: true,
                options: {
                    collectionId: timetable.id,
                    cascadeDelete: true,
                    maxSelect: 1,
                    displayFields: ['name'],
                },
            },
            {
                name: 'date',
                type: 'date',
                required: true,
            },
            {
                name: 'purpose',
                type: 'text',
                required: true,
            },
            {
                name: 'startTime',
                type: 'text',
                required: true,
            },
            {
                name: 'endTime',
                type: 'text',
                required: true,
            },
            {
                name: 'people',
                type: 'json',
                required: false,
                options: {
                    maxSize: 2000000,
                },
            },
        ],
        listRule: '@request.auth.id != "" && timetable.ausschuss.users.id ?= @request.auth.id',
        viewRule: '@request.auth.id != "" && timetable.ausschuss.users.id ?= @request.auth.id',
        createRule: '@request.auth.id != "" && timetable.ausschuss.users.id ?= @request.auth.id',
        updateRule: '@request.auth.id != "" && timetable.ausschuss.users.id ?= @request.auth.id',
        deleteRule: '@request.auth.id != "" && timetable.ausschuss.users.id ?= @request.auth.id',
    });

    app.save(shift);

}, (app) => {
    // Rollback: delete the collections
    const shift = app.findCollectionByNameOrId('shift');
    if (shift) {
        app.delete(shift);
    }

    const timetable = app.findCollectionByNameOrId('timetable');
    if (timetable) {
        app.delete(timetable);
    }
});
