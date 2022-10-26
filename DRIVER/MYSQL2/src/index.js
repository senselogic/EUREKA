// -- IMPORTS

import mysql2 from 'mysql2/promise';

// -- TYPES

export class Mysql2Driver
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

        this.connection = await mysql2.createConnection( this.configuration );
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

        this.connectionPool = await mysql2.createPool( this.configuration );
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
                await this.connectionPool.execute( statement, argumentArray )
                    .then(
                        function ( [ rowArray, fieldArray ] )
                        {
                            return rowArray;
                        }
                        )
                );
        }
        else if ( this.connection !== null )
        {
            if ( this.connection._closing )
            {
                await this.createConnection();
            }

            return (
                await this.connection.execute( statement, argumentArray )
                    .then(
                        function ( [ rowArray, fieldArray ] )
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
