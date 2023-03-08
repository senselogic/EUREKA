// -- IMPORTS

import {
    getDateText,
    getDateTimeText,
    getQuotedText,
    getTimeText,
    getUniversalDate,
    getUniversalDateTime,
    getUniversalTime,
    nullUuid,
    nullTuid
    } from 'senselogic-gist';

// -- TYPES

export class Property
{
    // -- CONSTRUCTORS

    constructor(
        database,
        name,
        value
        )
    {
        this.database = database;
        this.name = name;
        this.Value = value;
    }
}

// ~~

export class Type
{
    // -- CONSTRUCTORS

    constructor(
        database,
        table,
        column,
        name,
        subTypeArray = []
        )
    {
        this.database = database;
        this.table = table;
        this.column = column;
        this.name = name;
        this.subTypeArray = subTypeArray;
        this.isBoolean = ( name === 'BOOL' );
        this.isNatural = name.startsWith( 'UINT' );
        this.isInteger = name.startsWith( 'INT' );
        this.isReal = name.startsWith( 'FLOAT' );
        this.isNumeric = ( name === 'NUMERIC' || this.isBoolean || this.isNatural || this.isInteger || this.isReal );
        this.isTuid = ( name === 'TUID' );
        this.isUuid = ( name === 'UUID' );
        this.isDate = ( name === 'DATE' );
        this.isTime = ( name === 'TIME' );
        this.isDateTime = ( name === 'DATETIME' );
        this.isString = ( name.startsWith( 'STRING' ) || this.isTuid || this.Uuid || this.isDate || this.isDateTime );
        this.isList = ( name === 'LIST' );
        this.isMap = ( name === 'MAP' );
        this.isObject = ( name === 'OBJECT' );
        this.isJson = ( name === 'JSON' || this.isList || this.isMap || this.isObject );
    }

    // -- INQUIRIES

    getDefaultValue(
        )
    {
        if ( this.isReal )
        {
            return 0.0;
        }
        else if ( this.isNumeric )
        {
            return 0;
        }
        else if ( this.isTuid )
        {
            return nullTuid;
        }
        else if ( this.isUuid )
        {
            return nullUuid;
        }
        else if ( this.isDate )
        {
            return getDateText( getUniversalDate() );
        }
        else if ( this.isTime )
        {
            return getTimeText( getUniversalTime() );
        }
        else if ( this.isDateTime )
        {
            return getDateTimeText( getUniversalDateTime() );
        }
        else if ( this.isList )
        {
            return [];
        }
        else if ( this.isJson )
        {
            return {};
        }
        else
        {
            return '';
        }
    }
}

// ~~

export class Column
{
    // -- CONSTRUCTORS

    constructor(
        database,
        table,
        name
        )
    {
        this.database = database;
        this.table = table;
        this.name = name;
        this.type = null;
        this.defaultValue = undefined;
        this.propertyArray = [];
        this.propertyByNameMap = new Map();
        this.isKey = false;
    }

    // -- INQUIRIES

    getDefaultValue(
        )
    {
        if ( this.defaultValue !== undefined )
        {
            return this.defaultValue;
        }
        else
        {
            return this.type.getDefaultValue();
        }
    }

    // ~~

    hasProperty(
        propertyName
        )
    {
        return this.propertyByNameMap.has( propertyName );
    }

    // ~~

    getPropertyValue(
        propertyName,
        defaultPropertyValue
        )
    {
        let propertyValue = this.propertyByNameMap.get( propertyName );

        if ( propertyValue !== undefined )
        {
            return propertyValue;
        }
        else
        {
            return defaultPropertyValue;
        }
    }

    // ~~

    getEncodedName(
        )
    {
        return '`' + this.name + '`';
    }

    // ~~

    getEncodedType(
        )
    {
        switch ( this.type.name )
        {
            case 'BOOL' : return 'TINYINT UNSIGNED';
            case 'INT8' : return 'TINYINT';
            case 'UINT8' : return 'TINYINT UNSIGNED';
            case 'INT16' : return 'SMALLINT';
            case 'UINT16' : return 'SMALLINT UNSIGNED';
            case 'INT32' : return 'INT';
            case 'UINT32' : return 'INT UNSIGNED';
            case 'INT64' : return 'BIGINT';
            case 'UINT64' : return 'BIGINT UNSIGNED';
            case 'FLOAT32' : return 'FLOAT';
            case 'FLOAT64' : return 'DOUBLE';
            case 'STRING8' : return 'TINYTEXT';
            case 'STRING16' : return 'TEXT';
            case 'STRING24' : return 'MEDIUMTEXT';
            case 'STRING32' : return 'LONGTEXT';
            case 'STRING' :
            {
                if ( this.hasProperty( 'capacity' ) )
                {
                    return 'VARCHAR( ' + this.getPropertyValue( 'capacity' ) + ' )';
                }
                else
                {
                    return 'TEXT';
                }
            }
            case 'DATE' : return 'DATE';
            case 'TIME' : return 'TIME';
            case 'DATETIME' : return 'DATETIME';
            case 'TUID' : return 'VARCHAR( 22 )';
            case 'UUID' : return 'VARCHAR( 36 )';
            case 'BLOB' : return 'BLOB';
            default : return 'TEXT';
        }
    }

    // ~~

    getEncodedDeclaration(
        )
    {
        let encodedDeclaration
            = this.getEncodedName()
              + ' '
              + this.getEncodedType();

        if ( this.hasProperty( 'null' ) )
        {
            if ( this.getPropertyValue( 'null' ) )
            {
                encodedDeclaration += ' null';
            }
            else
            {
                encodedDeclaration += ' not null';
            }
        }

        if ( this.getPropertyValue( 'incremented', false ) )
        {
            encodedDeclaration += ' auto_increment';
        }

        return encodedDeclaration;
    }

    // ~~

    getEncodedValue(
        value
        )
    {
        if ( this.type.isNumeric )
        {
            return value;
        }
        else if ( this.type.isJson )
        {
             return getQuotedText( JSON.stringify( value ) );
        }
        else
        {
            return getQuotedText( value );
        }
    }

    // ~~

    getDecodedValue(
        value
        )
    {
        if ( this.type.isNumeric )
        {
            return Number( value );
        }
        else if ( this.type.isDate )
        {
            return getDateText( getUniversalDate( value ) );
        }
        else if ( this.type.isTime )
        {
            return getTimeText( getUniversalTime( value ) );
        }
        else if ( this.type.isDateTime )
        {
            return getDateTimeText( getUniversalDateTime( value ) );
        }
        else if ( this.type.isJson )
        {
            return JSON.parse( value );
        }
        else
        {
            return value;
        }
    }

    // -- OPERATIONS

    setType(
        type
        )
    {
        this.type = type;
    }

    // ~~

    setDefaultValue(
        defaultValue
        )
    {
        this.defaultValue = defaultValue;
    }

    // ~~

    setPropertyArray(
        propertyArray
        )
    {
        this.propertyArray = propertyArray;

        for ( let property of this.propertyArray )
        {
            this.propertyByNameMap.set( property.name, property );

            if ( property.name === 'key' )
            {
                this.isKey = true;
            }
        }
    }
}

// ~~

export class Table
{
    // -- CONSTRUCTORS

    constructor(
        database,
        name
        )
    {
        this.database = database;
        this.name = name;
        this.columnArray = [];
        this.columnByNameMap = new Map();
        this.propertyArray = [];
        this.propertyByNameMap = new Map();
    }

    // -- INQUIRIES

    getColumnByName(
        columnName
        )
    {
        let column = this.columnByNameMap.get( columnName );

        if ( column === undefined )
        {
            throw new Error( 'Invalid column name : ' + columnName );
        }

        return column;
    }

    // ~~

    getFilledRow(
        row
        )
    {
        let filledRow = {};

        for ( let column of this.columnArray )
        {
            if ( row.hasOwnProperty( column.name )
                 && row[ column.name ] !== undefined )
            {
                filledRow[ column.name ] = row[ column.name ];
            }
            else
            {
                filledRow[ column.name ] = column.getDefaultValue();
            }
        }

        return filledRow;
    }

    // ~~

    getEncodedName(
        )
    {
        return '`' + this.database.name + '`.`' + this.name + '`';
    }

    // ~~

    getEncodedRow(
        row
        )
    {
        let encodedRow = {};

        for ( let columnName of Object.keys( row ) )
        {
            let column = this.columnByNameMap.get( columnName );

            if ( column === undefined )
            {
                throw new Error( 'Invalid column name : ' + columnName );
            }
            else
            {
                encodedRow[ columnName ] = column.getEncodedValue( row[ columnName ] );
            }
        }

        return encodedRow;
    }

    // ~~

    getDecodedRow(
        row
        )
    {
        let decodedRow = {};

        for ( let columnName of Object.keys( row ) )
        {
            let column = this.columnByNameMap.get( columnName );

            if ( column === undefined )
            {
                throw new Error( 'Invalid column name : ' + columnName );
            }
            else
            {
                decodedRow[ columnName ] = column.getDecodedValue( row[ columnName ] );
            }
        }

        return decodedRow;
    }

    // ~~

    getDecodedRowArray(
        rowArray
        )
    {
        let decodedRowArray = [];

        for ( let row of rowArray )
        {
            decodedRowArray.push( this.getDecodedRow( row ) );
        }

        return decodedRowArray;
    }

    // ~~

    getEncodedColumnDeclarationArray(
        )
    {
        let encodedColumnDeclarationArray = [];

        for ( let column of this.columnArray )
        {
            encodedColumnDeclarationArray.push( column.getEncodedDeclaration() );
        }

        return encodedColumnDeclarationArray;
    }

    // ~~

    getEncodedColumnNameArray(
        columnNameArray
        )
    {
        let encodedColumnNameArray = [];

        for ( let columnName of columnNameArray )
        {
            encodedColumnNameArray.push( '`' + columnName + '`' );
        }

        return encodedColumnNameArray;
    }

    // ~~

    getEncodedSortingColumnName(
        sortingColumnName
        )
    {
        switch ( sortingColumnName.substring( 0, 1 ) )
        {
            case '+' :
            {
                return '`' + sortingColumnName.substring( 1 ) + '` asc';
            }

            case '-' :
            {
                return '`' + sortingColumnName.substring( 1 ) + '` desc';
            }

            default :
            {
                return '`' + sortingColumnName + '` asc';
            }
        }
    }

    // ~~

    getEncodedSortingColumnNameArray(
        sortingColumnNameArray
        )
    {
        let encodedSortingColumnNameArray = [];

        for ( let sortingColumnName of sortingColumnNameArray )
        {
            encodedSortingColumnNameArray.push( this.getEncodedSortingColumnName( sortingColumnName ) );
        }

        return encodedSortingColumnNameArray;
    }

    // ~~

    getEncodedRowColumnNameArray(
        encodedRow
        )
    {
        let encodedRowColumnNameArray = [];

        for ( let columnName of Object.keys( encodedRow ) )
        {
            encodedRowColumnNameArray.push( '`' + columnName + '`' );
        }

        return encodedRowColumnNameArray;
    }

    // ~~

    getEncodedRowColumnValueArray(
        encodedRow
        )
    {
        let encodedRowColumnValueArray = [];

        for ( let columnName of Object.keys( encodedRow ) )
        {
            encodedRowColumnValueArray.push( encodedRow[ columnName ] );
        }

        return encodedRowColumnValueArray;
    }

    // ~~

    getEncodedRowColumnAssignmentArray(
        encodedRow,
        columnIsKey
        )
    {
        let encodedRowColumnAssignmentArray = [];

        for ( let columnName of Object.keys( encodedRow ) )
        {
            let column = this.columnByNameMap.get( columnName );

            if ( column === undefined )
            {
                throw new Error( 'Invalid column name : ' + columnName );
            }
            else
            {
                if ( column.isKey === columnIsKey )
                {
                    encodedRowColumnAssignmentArray.push(
                        '`' + columnName + '` = ' + encodedRow[ columnName ]
                        );
                }
            }
        }

        return encodedRowColumnAssignmentArray;
    }

    // ~~

    getEncodedValue(
        value
        )
    {
        if ( typeof value === 'number' )
        {
            return value;
        }
        else if ( typeof value === 'string' )
        {
            return getQuotedText( value );
        }
        else if ( Array.isArray( value ) )
        {
            return this.getEncodedExpression( value );
        }
        else
        {
            throw Error( 'Invalid condition value : ' + value );
        }
    }

    // ~~

    getEncodedExpression(
        expression
        )
    {
        if ( typeof expression === 'string' )
        {
            return expression;
        }
        else if ( Array.isArray( expression ) )
        {
            if ( expression.length === 1
                 && typeof expression[ 0 ] === 'string' )
            {
                if ( expression[ 0 ] === '?' )
                {
                    return '?';
                }
                else
                {
                    return '`' + expression[ 0 ] + '`';
                }
            }
            else if ( expression.length === 2 )
            {
                if ( expression[ 0 ] === 'not' )
                {
                    return (
                        '( not '
                        + this.getEncodedValue( expression[ 2 ] )
                        + ' )'
                        );
                }
            }
            else if ( expression.length >= 3
                      && ( expression.length & 1 ) === 1 )
            {
                let encodedExpression
                    = '( ' + this.getEncodedValue( expression[ 0 ] );

                for ( let expressionTokenIndex = 1;
                      expressionTokenIndex + 1 < expression.length;
                      expressionTokenIndex += 2 )
                {
                    encodedExpression
                        += ' '
                           + expression[ expressionTokenIndex ]
                           + ' '
                           + this.getEncodedValue( expression[ expressionTokenIndex + 1 ] );
                }

                encodedExpression += ' )';

                return encodedExpression;
            }
        }

        throw new Error( 'Invalid condition expression : ' + JSON.stringify( expression ) );
    }

    // ~~

    async create(
        )
    {
        let statement
            = 'create table if not exists '
              + this.getEncodedName()
              + '( '
              + this.getEncodedColumnDeclarationArray().join( ', ' );

        for ( let column of this.columnArray )
        {
            if ( column.isKey )
            {
                statement += ', primary key(`' + column.name + '`)';
            }
        }

        statement += ' )';

        await this.database.query( statement );
    }

    // ~~

    async drop(
        )
    {
        let statement
            = 'drop table if exists '
              + this.getEncodedName();

        await this.database.query( statement );
    }

    // ~~

    async queryRows(
        statement,
        argumentArray = undefined
        )
    {
        let rowArray = await this.database.query( statement, argumentArray );

        return this.getDecodedRowArray( rowArray );
    }

    // ~~

    async selectRows(
        {
            columns,
            where,
            order,
            limit,
            values
        } = {}
        )
    {
        let statement = 'select ';

        if ( columns !== undefined )
        {
            if ( Array.isArray( columns ) )
            {
                statement += this.getEncodedColumnNameArray( columns ).join( ', ' );
            }
            else
            {
                statement += columns;
            }
        }
        else
        {
            statement += '*';
        }

        statement += ' from ' + this.getEncodedName();

        if ( where !== undefined )
        {
            statement += ' where ' + this.getEncodedExpression( where );
        }

        if ( order !== undefined )
        {
            if ( Array.isArray( order ) )
            {
                statement += ' order by ' + this.getEncodedOrder( order ).join( ', ' );
            }
            else
            {
                statement += ' order by ' + this.getEncodedSortingColumnName( order );
            }
        }

        if ( limit !== undefined )
        {
            statement += ' limit ' + limit;
        }

        let rowArray = await this.database.query( statement, values );

        return this.getDecodedRowArray( rowArray );
    }

    // ~~

    async selectRow(
        {
            columns,
            where,
            values
        } = {}
        )
    {
        let rowArray = await this.selectRows(  { columns, where, limit : 1, values } );

        if ( rowArray.length > 0 )
        {
            return rowArray[ 0 ];
        }
        else
        {
            return null;
        }
    }

    // ~~

    async hasRow(
        {
            columns,
            where,
            values
        } = {}
        )
    {
        let rowArray = await this.selectRows( { columns, where, limit : 1, values } );

        return rowArray.length > 0;
    }

    // ~~

    async insertRow(
        row
        )
    {
        let filledRow = this.getFilledRow( row );
        let encodedRow = this.getEncodedRow( filledRow );
        let statement
            = 'insert into '
              + this.getEncodedName()
              + '( '
              + this.getEncodedRowColumnNameArray( encodedRow ).join( ', ' )
              + ' ) values ( '
              + this.getEncodedRowColumnValueArray( encodedRow ).join( ', ' )
              + ' )';

        await this.database.query( statement );

        return filledRow;
    }

    // ~~

    async replaceRow(
        row
        )
    {
        let filledRow = this.getFilledRow( row );
        let encodedRow = this.getEncodedRow( filledRow );
        let statement
            = 'replace into '
              + this.getEncodedName()
              + '( '
              + this.getEncodedRowColumnNameArray( encodedRow ).join( ', ' )
              + ' ) values ( '
              + this.getEncodedRowColumnValueArray( encodedRow ).join( ', ' )
              + ' )';

        await this.database.query( statement );

        return filledRow;
    }

    // ~~

    async updateRow(
        row
        )
    {
        let encodedRow = this.getEncodedRow( row );
        let statement
            = 'update '
              + this.getEncodedName()
              + ' set '
              + this.getEncodedRowColumnAssignmentArray( encodedRow, false ).join( ', ' )
              + ' where'
              + this.getEncodedRowColumnAssignmentArray( encodedRow, true ).join( ', ' );

        await this.database.query( statement );
    }

    // ~~

    async deleteRow(
        row
        )
    {
        let encodedRow = this.getEncodedRow( row );
        let statement
            = 'delete from '
              + this.getEncodedName()
              + ' where'
              + this.getEncodedRowColumnAssignmentArray( encodedRow, true ).join( ', ' );

        await this.database.query( statement );
    }

    // -- OPERATIONS

    setColumnArray(
        columnArray
        )
    {
        this.columnArray = columnArray;

        for ( let column of columnArray )
        {
            this.columnByNameMap.set( column.name, column );
        }
    }

    // ~~

    setPropertyArray(
        propertyArray
        )
    {
        this.propertyArray = propertyArray;

        for ( let property of this.propertyArray )
        {
            this.propertyByNameMap.set( property.name, property );
        }
    }
}

// ~~

export class Database
{
    // -- CONSTRUCTORS

    constructor(
        name
        )
    {
        this.name = name;
        this.tableArray = [];
        this.tableByNameMap = new Map();
        this.driver = null;
    }

    // -- INQUIRIES

    getTableByName(
        tableName
        )
    {
        let table = this.tableByNameMap.get( tableName );

        if ( table === undefined )
        {
            throw new Error( 'Invalid table name : ' + tableName );
        }

        return table;
    }

    // ~~

    getPropertyArray(
        propertyDataArray
        )
    {
        var
            property;

        let propertyArray = [];

        for ( let propertyData of propertyDataArray )
        {
            if ( typeof propertyData === 'string' )
            {
                if ( propertyData.startsWith( '!' ) )
                {
                    property = new Property( this, propertyData.substring( 1 ), false );
                }
                else
                {
                    property = new Property( this, propertyData, true );
                }
            }
            else if ( Array.isArray( propertyData )
                      && propertyData.length === 2 )
            {
                property = new Property( this, propertyData[ 0 ], propertyData[ 1 ] );
            }
            else
            {
                throw new Error( 'Invalid property data : ' + JSON.stringify( propertyData ) );
            }

            propertyArray.push( property );
        }

        return propertyArray;
    }

    // ~~

    GetType(
        table,
        column,
        typeDataArray
        )
    {
        var
            name;

        let subTypeArray = [];

        if ( typeof typeDataArray === 'string' )
        {
            name = typeDataArray;
        }
        else if ( Array.isArray( typeDataArray )
                  && typeDataArray.length > 0 )
        {
            name = typeDataArray[ 0 ];

            for ( let typeDateIndex = 1;
                  typeDateIndex < typeDataArray.length;
                  ++typeDateIndex )
            {
                let subType = this.GetType( table, column, typeDataArray[ typeDateIndex ] );
                subTypeArray.push( subType );
            }
        }
        else
        {
            throw new Error( 'Invalid type data for column ' + column.name + ' of table ' + table.name + ' : ' + JSON.stringify( typeDataArray ) );
        }

        let type = new Type( this, table, column, name, subTypeArray );

        return type;
    }

    // ~~

    getColumnArray(
        table,
        columnDataArrayArray
        )
    {
        let columnArray = [];

        for ( let columnDataArray of columnDataArrayArray )
        {
            if ( Array.isArray( columnDataArray )
                 && columnDataArray.length >= 2 )
            {
                let column = new Column( this, table, columnDataArray[ 0 ] );
                column.setType( this.GetType( table, column, columnDataArray[ 1 ] ) );

                if ( columnDataArray.length >= 3 )
                {
                    column.setPropertyArray( this.getPropertyArray( columnDataArray[ 2 ] ) );
                }

                if ( columnDataArray.length == 4 )
                {
                    column.setDefaultValue( columnDataArray[ 3 ] );
                }

                columnArray.push( column );
            }
            else
            {
                throw new Error( 'Invalid column data for table ' + table.name + ' : ' + JSON.stringify( columnDataArray ) );
            }
        }

        return columnArray;
    }

    // -- OPERATIONS

    addTable(
        name,
        columnDataArrayArray = [],
        propertyDataArray = []
        )
    {
        let table = new Table( this, name );
        table.setColumnArray( this.getColumnArray( table, columnDataArrayArray ) );
        table.setPropertyArray( this.getPropertyArray( propertyDataArray ) );

        this.tableArray.push( table );
        this.tableByNameMap.set( name, table );

        return table;
    }

    // ~~

    setDriver(
        driver
        )
    {
        this.driver = driver;
    }

    // ~~

    async createConnection(
        configuration
        )
    {
        await this.driver.createConnection(
            {
                database : this.name,
                ...configuration
            }
            );
    }

    // ~~

    async createConnectionPool(
        configuration
        )
    {
        await this.driver.createConnectionPool(
            {
                database : this.name,
                ...configuration
            }
            );
    }

    // ~~

    async query(
        statement,
        argumentArray = undefined
        )
    {
        return this.driver.query( statement, argumentArray );
    }

    // ~~

    async createTables(
        )
    {
        for ( let table of this.tableArray )
        {
            await table.create();
        }
    }

    // ~~

    async dropTables(
        )
    {
        for ( let table of this.tableArray )
        {
            await table.drop();
        }
    }
}
