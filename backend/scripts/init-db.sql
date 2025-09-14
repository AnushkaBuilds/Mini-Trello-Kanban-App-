#!/bin/bash

# Create the database if it doesn't exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
    CREATE DATABASE mini_trello;
    GRANT ALL PRIVILEGES ON DATABASE mini_trello TO $POSTGRES_USER;
EOSQL
