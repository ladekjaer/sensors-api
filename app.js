const app = require('root')()
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
            res.writeHead(400, {'content-type': 'text/plain; charset=utf8'});
            return res.end('The body is not well-formed JSON.\n');
        }
        let access_key = req.headers['access-key']
        verifyAccessKey(access_key, function(err, user) {
        	if (err || !user) {
        		res.writeHead(401, {'content-type': 'text/plain; charset=utf8'})
        		return res.end('Invalid access key.\n')
        	} else {
        		commitStats(stats, user.user_id, function(err, measures) {
        			if (err) {
        				res.writeHead(500, {'content-type': 'text/plain; charset=utf8'});
		                res.write('Error commit to database.\n');
		                res.write('The database is as before the HTTP request.\n');
		                res.end()
		                logError(err)
        			} else {
        				res.writeHead(201, {'content-type': 'text/plain; charset=utf8'})
		                res.end(JSON.stringify(measures, null, 4))
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
				     , k.key
				FROM
				    users u
				        RIGHT OUTER JOIN access_keys k on k.owner_id = u.user_id
				WHERE
				    k.key = $1::text;`
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

function commitStats(stats, owner_id, callback) {
	const sql =	`INSERT INTO temperature
				(hostname, pi_id, thermometer_id, capture_time, temperature, owner_id, uuid)
				VALUES
				($1::text, $2::text, $3::text, $4::timestamptz, $5::float, $6::integer, $7::uuid);`

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
			owner_id,
			stat.uuid || null
		]

		const query = {
			name: 'commit-stats',
			text: sql,
			values: values
		}

		pool.query(query, (err, res) => {
			if (err) {
				if (err.constraint && err.constraint === 'temperature_uuid_key') {
					logError(err.detail)
				} else {
					logError(err)
					errors.push(err)
				}
			}

			measures.push({
				uuid: stat.uuid,
				status: (err ? 'rejected' : 'accepted'),
				error: (err ? err.detail : null),
				result: (res ? {
					command: res.command,
					rowCount: res.rowCount,
					rows: res.rows,
					rowAsArray: res.rowAsArray
				} : undefined)
			})

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
