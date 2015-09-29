#!/usr/bin/env node
var _ = require('lodash')
var argv = require('minimist')(process.argv.slice(2))
var lexer = require('sql-parser').lexer
var request = require('request')

var TOKEN = 0,
    VALUE = 1;
var SCHEME = 'http://'

var sqlQuery = argv.query || argv.q
var host = argv.host || argv.h

var tokenizedQuery = lexer.tokenize(sqlQuery)

function getValue(tokenSet) {
    if(tokenSet[TOKEN] === 'NUMBER') {
        return parseInt(tokenSet[VALUE])
    }

    return tokenSet[VALUE]
}

function getLimit(tokenizedQuery) {
    var limitTokenIndex = _.findIndex(tokenizedQuery, function(tokenSet) {
        return tokenSet[TOKEN] == 'LIMIT'
    })

    if(limitTokenIndex === -1) {
        return null
    }

    return getValue(tokenizedQuery[limitTokenIndex + 1])
}

function getCriteria(tokenizedQuery) {
    var whereTokenIndex = _.findIndex(tokenizedQuery, function(tokenSet) {
        return tokenSet[TOKEN] == 'WHERE'
    })

    if(whereTokenIndex === -1) {
        return null
    }

    var criteria = [
        getValue(tokenizedQuery[whereTokenIndex + 1]), // column name
        getValue(tokenizedQuery[whereTokenIndex + 3]), // value
        getValue(tokenizedQuery[whereTokenIndex + 2])  // operator
    ]

    return [criteria]
}

function getColumnNames(tokenizedQuery) {
    // Check for *
    var selectTokenIndex = _.findIndex(tokenizedQuery, function(tokenSet) {
        return tokenSet[TOKEN] == 'SELECT'
    })

    if(selectTokenIndex === -1 || tokenizedQuery[selectTokenIndex + 1][TOKEN] === 'STAR') {
        return null
    }

    var fields = []

    for(var i = selectTokenIndex; tokenizedQuery[i][TOKEN] !== 'FROM'; i++) {
        var tokenSet = tokenizedQuery[i]
        if(tokenSet[TOKEN] === 'LITERAL') {
            fields.push(getValue(tokenSet))
        }
    }

    return fields
}

function getESIndex(tokenizedQuery) {
    var fromTokenIndex = _.findIndex(tokenizedQuery, function(tokenSet) {
        return tokenSet[TOKEN] === 'FROM'
    })
    return getValue(tokenizedQuery[fromTokenIndex + 1])
}

function buildPayload(columns, criteria, limit) {
    return {
        'criteria': criteria,
        'fields': columns,
        'size': limit
    }
}

function buildDataQuery(tokenizedQuery, host) {
    var tableName = getESIndex(tokenizedQuery)
    var columns = getColumnNames(tokenizedQuery)
    var criteria = getCriteria(tokenizedQuery)
    var limit = getLimit(tokenizedQuery)

    var url = SCHEME + host.replace('{product}', tableName)

    var payload = buildPayload(columns, criteria, limit)

    request({
        'url': url,
        'method': 'POST',
        'json': payload
    }, function(error, response, body) {
        if(error) {
            return console.log(error)
        }

        console.log(JSON.stringify(body, null, 4))
    })
}

buildDataQuery(tokenizedQuery, host)