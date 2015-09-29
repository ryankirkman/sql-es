sql-es
======

Use SQL syntax to query a custom REST API with ElasticSearch-like parameters

Install (as a command line util)
================================
`npm install sql-es -g`


Usage
=====
NB: The input file will be assigned to a variable called `json` for use in the `--array` command line argument.

`-h` or `--host`: Host template. Note `{product}` in the template below. `sql-es` will substitute in the `table` value from the SQL query. Note for the host that HTTP will be assumed and prepended.

`-q` or `--query`: The SQL query

## Usage Example

### Simple
`sql-es -h host.com/product/{product}/search -q 'SELECT * FROM table WHERE id > 3200 LIMIT 10'`

Result
======
A JSON string with indentation set to 4. Assumes the result of the POST request will be JSON.

Misc
====
This is super hacked to gether and extremely specific to my use case. Good luck using it on your own.

Just read the source. It's only ~100 lines.
