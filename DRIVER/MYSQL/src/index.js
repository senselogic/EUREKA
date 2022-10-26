// -- IMPORTS

import mysql from 'mysql';

// -- TYPES

export class MysqlDriver
{
    // -- CONSTRUCTORS

    constructor(
        )
    {
        this.configuration = null;
        this.connection = null;
        this.connectionPool = null;
    }

    // -- OPERATIONS

    async createConnection(
        configuration
        )
    {
        if ( configuration !== undefined )
        {
            this.configuration = configuration;
        }

        if ( this.connection !== null )
        {
            this.connection.end();
        }

        this.connection = await mysql.createConnection( this.configuration );
    }

    // ~~

    async createConnectionPool(
        configuration
        )
    {
        if ( configuration !== undefined )
        {
            this.configuration = configuration;
        }

        if ( this.connectionPool !== null )
        {
            this.connectionPool.end();
        }

        this.connectionPool = await mysql.createPool( this.configuration );
    }

    // ~~

    async query(
        statement,
        argumentArray = undefined
        )
    {
        if ( this.connectionPool !== null )
        {
            return (
                await this.connectionPool.query( statement, argumentArray )
                    .then(
                        function ( error, rowArray, fieldArray )
                        {
                            return rowArray;
                        }
                        )
                );
        }
        else if ( this.connection !== null )
        {
            return (
                await this.connection.query( statement, argumentArray )
                    .then(
                        function ( error, rowArray, fieldArray )
                        {
                            return rowArray;
                        }
                        )
                );
        }
        else
        {
            throw new Error( 'No connection' );
        }
    }
}

