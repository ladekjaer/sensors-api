const express = require('express')
const app = express()
const { Pool, Client } = require('pg')
require('dotenv').config()

const PORT = process.env.PORT
const pool = new Pool()

app.post('/stats', function(req, res) {
	req.setEncoding('utf8')
	let body = ''
	req.on('data', function(chunk) {
		body += chunk
	})
	req.on('end', function() {
		let stats
		try {
			stats = JSON.parse(body)
		} catch (err) {
			return res.status(400).json({error: 'invalid_json'})
		}
		let access_key = req.headers['access-key']
		verifyAccessKey(access_key, function(err, user_with_key) {
			if (err || !user_with_key) {
				return res.status(401).json({error: 'invalid_access_key'})
			} else {
				commitStats(stats, user_with_key, function(err, measures) {
					if (err) {
						res.status(500).json({error: 'database_error'})
						logError(err)
					} else {
						res.status(201).json(measures)
					}

					let accepted = measures.filter(m => m.status === 'accepted')
					let rejected = measures.filter(m => m.status === 'rejected')

					log('%s of %s measures from %s accepted (%s rejected)',
						accepted.length, measures.length, stats[0].pi_id, rejected.length)
				})
			}
		})
	})
})

app.listen(PORT, function() {
	log('sensors-api listening on port %s', PORT)
})

function verifyAccessKey(access_key, callback) {
	let sql = `	SELECT
					user_id
					 , role_id
					 , k.key_id
					 , k.key
				FROM
					users u
						RIGHT OUTER JOIN access_keys k on k.owner_id = u.user_id
				WHERE
					k.status = 'enabled'
					AND k.key = $1::text;`
	pool.query(sql, [access_key], (err, res) => {
		if (err) {
			logError(err)
			return callback(err, false)
		} else {
			if (!res.rows || !res.rows[0]) return callback(null, false)
			return callback(null, res.rows[0])
		}
	})
}

function commitStats(stats, user_with_key, callback) {
	const sql =	`INSERT INTO temperature
				(hostname, pi_id, thermometer_id, capture_time, temperature, owner_id, access_key_id, uuid)
				VALUES
				($1::text, $2::text, $3::text, $4::timestamptz, $5::float, $6::integer, $7::integer, $8::uuid);`

	let measures = []

	let errors = []
	
	let counter = 0

	stats.forEach(function(stat) {
		const values = [
			stat.hostname,
			stat.pi_id,
			stat.thermostat_id,
			stat.timestamp,
			stat.temp,
			user_with_key.user_id,
			user_with_key.key_id,
			stat.uuid || null
		]

		const query = {
			name: 'commit-stats',
			text: sql,
			values: values
		}

		pool.query(query, (err, res) => {

			let measure = {
				uuid: stat.uuid,
				result: (res ? {
					command: res.command,
					rowCount: res.rowCount,
					rows: res.rows,
					rowAsArray: res.rowAsArray
				} : undefined)
			}

			if (err && err.constraint && err.constraint === 'temperature_uuid_key') {
				// The measurement has already been comitted to the database
				measure.status = 'already accepted'
				measure.error = err.detail
				logError(err.detail)
			} else if (err) {
				// An actual error has occurred
				measure.status = 'rejected'
				measure.error = err.detail
				logError(err)
				errors.push(err)
			} else {
				// No error has occurred
				measure.status = 'accepted'
			}

			measures.push(measure)

			if (++counter === stats.length) {
				return callback(errors.length ? errors : null, measures)
			}
		})
	})
}

function log(msg) {
	let now = new Date().toISOString()
	msg = generateLogMessage(msg, arguments)
	console.log('[%s] %s', now, msg)
}

function logError(msg) {
	let now = new Date().toISOString()
	msg = generateLogMessage(msg, arguments)
	console.error('[%s] %s', now, msg)
}

function generateLogMessage(msg) {
	let args = Array.prototype.slice.call(arguments[1], 1)
	args.forEach(function(arg) {
		msg = msg.replace('%s', arg)
	})
	return msg
}
