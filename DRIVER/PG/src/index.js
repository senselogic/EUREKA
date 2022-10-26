// -- IMPORTS

import { Client, Pool } from 'pg';

// -- TYPES

export class PgDriver
{
    // -- CONSTRUCTORS

    constructor(
        )
    {
        this.configuration = null;
        this.client = null;
        this.pool = null;
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

        if ( this.client !== null )
        {
            await this.client.end();
        }

        this.client = new Client( this.configuration );
        this.client.connect();
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

        if ( this.pool !== null )
        {
            await this.pool.end();
        }

        this.pool = new Pool( this.configuration );
    }

    // ~~

    async query(
        statement,
        argumentArray = undefined
        )
    {
        if ( this.pool !== null )
        {
            return (
                await this.pool.query( statement, argumentArray )
                    .then(
                        function ( error, rowArray )
                        {
                            return rowArray;
                        }
                        )
                );
        }
        else if ( this.client !== null )
        {
            return (
                await this.client.query( statement, argumentArray )
                    .then(
                        function ( error, rowArray )
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
