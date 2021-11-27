# Sensors API

This webapp is a http server running to receive data from sensors and saving it to a database. Data can be sent by the [Sensors Client for Raspberry Pi Zero W](https://github.com/ladekjaer/sensors-client-raspberry-pi-zero-w).

## Setup
`sensors-api` needs a running PostgreSQL runnung. See `database/create_db.sql` in this repository for definitions of the required tables.

Clone from GitHub
```sh
$ git clone https://github.com/ladekjaer/sensors-api.git
```
Create and edit the `.env`
```sh
$ cd sensors-api
$ cp .env.example .env
$ vi .env
```
Now simply run it with
```sh
$ node app.js
```
