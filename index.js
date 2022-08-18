// -- IMPORTS

import mysql from 'mysql2/promise';

// -- FUNCTIONS

export function GetEncodedBase64(
    text
    )
{
    try
    {
        return btoa( text );
    }
    catch ( error )
    {
        return Buffer.from( text, "binary" ).toString( "base64" );
    }
}

// ~~

export function GetDecodedBase64(
    text
    )
{
    try
    {
        return atob( text );
    }
    catch ( error )
    {
        return Buffer.from( text , 'base64').toString( "binary" );
    }
}

// ~~

export function GetTuid(
    uuid
    )
{
    return GetEncodedBase64( uuid.replaceAll( "-", "" ) );
}

// ~~

export function MakeTuid(
    )
{
    return GetTuid( crypto.randomUUID() );
}

// ~~

export function MakeUuid(
    )
{
    return crypto.randomUUID();
}

// -- TYPES

export class PROPERTY
{
    // -- CONSTRUCTORS

    constructor(
        database,
        name,
        value
        )
    {
        this.Database = database;
        this.Name = name;
        this.Value = value;
    }
}

// ~~

export class TYPE
{
    // -- CONSTRUCTORS

    constructor(
        database,
        table,
        column,
        name,
        sub_type_array = []
        )
    {
        this.Database = database;
        this.Table = table;
        this.Column = column;
        this.Name = name;
        this.SubTypeArray = [];
        this.IsBoolean = ( name === "BOOL" );
        this.IsNatural = ( name === "UINT8" || name === "UINT16" || name === "UINT32" || name === "UINT64" );
        this.IsInteger = ( name === "INT8" || name === "INT16" || name === "INT32" || name === "INT64" );
        this.IsReal = ( name == "FLOAT32" || name == "FLOAT64" );
        this.IsNumeric = ( this.IsBoolean || this.IsNatural || this.IsInteger || this.IsReal );
        this.IsList = ( name === "LIST" );
        this.IsMap = ( name === "MAP" );
        this.IsStructured = ( this.IsList || this.IsMap );
        this.IsTuid = ( name === "TUID" );
        this.IsUuid = ( name === "UUID" );
        this.IsString = ( name === "STRING" );
    }

    // -- INQUIRIES

    GetDefaultValue(
        )
    {
        if ( this.IsReal )
        {
            return 0.0;
        }
        else if ( this.IsNumeric )
        {
            return 0;
        }
        else if ( this.IsList )
        {
            return [];
        }
        else if ( this.IsMap )
        {
            return {};
        }
        else
        {
            return "";
        }
    }
}

// ~~

export class COLUMN
{
    // -- CONSTRUCTORS

    constructor(
        database,
        table,
        name
        )
    {
        this.Database = database;
        this.Table = table;
        this.Name = name;
        this.Type = null;
        this.DefaultValue = "";
        this.PropertyArray = [];
        this.PropertyByNameMap = new Map();
        this.IsKey = false;
    }

    // -- INQUIRIES

    GetQuotedValue(
        value
        )
    {
        return "\"" + value.toString().replaceAll( "\"", "\\\"" ) + "\"";
    }

    // ~~

    GetEncodedValue(
        value
        )
    {
        if ( this.Type.IsNumeric )
        {
            return value;
        }
        else if ( this.Type.IsStructured )
        {
             return this.GetQuotedValue( JSON.stringify( value ) );
        }
        else
        {
            return this.GetQuotedValue( value );
        }
    }

    // ~~

    GetDecodedValue(
        value
        )
    {
        if ( this.Type.IsNumeric )
        {
            return Number( value );
        }
        else if ( this.Type.IsStructured )
        {
            return JSON.parse( value );
        }
        else
        {
            return value;
        }
    }

    // -- OPERATIONS

    SetType(
        type
        )
    {
        this.Type = type;
        this.DefaultValue = type.GetDefaultValue();
    }

    // ~~

    SetDefaultValue(
        default_value
        )
    {
        this.DefaultValue = default_value;
    }

    // ~~

    SetPropertyArray(
        property_array
        )
    {
        this.PropertyArray = property_array;

        for ( let property of this.PropertyArray )
        {
            this.PropertyByNameMap.set( property.Name, property );

            if ( property.Name === "key" )
            {
                this.IsKey = true;
            }
        }
    }
}

// ~~

export class TABLE
{
    // -- CONSTRUCTORS

    constructor(
        database,
        name
        )
    {
        this.Database = database;
        this.Name = name;
        this.ColumnArray = [];
        this.ColumnByNameMap = new Map();
        this.PropertyArray = [];
        this.PropertyByNameMap = new Map();
    }

    // -- INQUIRIES

    GetColumnByName(
        column_name
        )
    {
        let column = this.ColumnByNameMap.get( column_name );

        if ( column === undefined )
        {
            throw new Error( "Invalid column name : " + column_name );
        }

        return column;
    }

    // ~~

    GetFullRow(
        row
        )
    {
        let full_row = {};

        for ( let column of this.ColumnArray )
        {
            if ( row.hasOwnProperty( column.Name ) )
            {
                full_row[ column.Name ] = row[ column.Name ];
            }
            else
            {
                full_row[ column.Name ] = column.DefaultValue;
            }
        }

        return full_row;
    }

    // ~~

    GetEncodedName(
        )
    {
        return "`" + this.Database.Name + "`.`" + this.Name + "`";
    }

    // ~~

    GetEncodedRow(
        row
        )
    {
        let encoded_row = {};

        for ( let column_name of Object.keys( row ) )
        {
            let column = this.ColumnByNameMap.get( column_name );

            if ( column === undefined )
            {
                throw new Error( "Invalid column name : " + column_name );
            }
            else
            {
                encoded_row[ column_name ] = column.GetEncodedValue( row[ column_name ] );
            }
        }

        return encoded_row;
    }

    // ~~

    GetDecodedRow(
        row
        )
    {
        let decoded_row = {};

        for ( let column_name of Object.keys( row ) )
        {
            let column = this.ColumnByNameMap.get( column_name );

            if ( column === undefined )
            {
                throw new Error( "Invalid column name : " + column_name );
            }
            else
            {
                decoded_row[ column_name ] = column.GetDecodedValue( row[ column_name ] );
            }
        }

        return decoded_row;
    }

    // ~~

    GetDecodedRowArray(
        row_array
        )
    {
        let decoded_row_array = [];

        for ( let row of row_array )
        {
            decoded_row_array.push( this.GetDecodedRow( row ) );
        }

        return decoded_row_array;
    }

    // ~~

    GetEncodedRowColumnNameArray(
        encoded_row
        )
    {
        let encoded_row_column_name_array = [];

        for ( let column_name of Object.keys( encoded_row ) )
        {
            encoded_row_column_name_array.push( "`" + column_name + "`" );
        }

        return encoded_row_column_name_array;
    }

    // ~~

    GetEncodedRowColumnValueArray(
        encoded_row
        )
    {
        let column_row_column_value_array = [];

        for ( let column_name of Object.keys( encoded_row ) )
        {
            column_row_column_value_array.push( encoded_row[ column_name ] );
        }

        return column_row_column_value_array;
    }

    // ~~

    GetEncodedRowColumnAssignmentArray(
        encoded_row,
        column_is_key
        )
    {
        let encoded_row_column_assignment_array = [];

        for ( let column_name of Object.keys( encoded_row ) )
        {
            let column = this.ColumnByNameMap.get( column_name );

            if ( column === undefined )
            {
                throw new Error( "Invalid column name : " + column_name );
            }
            else
            {
                if ( column.IsKey === column_is_key )
                {
                    encoded_row_column_assignment_array.push(
                        "`" + column_name + "` = " + encoded_row[ column_name ]
                        );
                }
            }
        }

        return encoded_row_column_assignment_array;
    }

    // ~~

    async SelectRows(
        statement = undefined,
        argument_array = undefined
        )
    {
        if ( statement === undefined )
        {
            statement = "select * from " + this.GetEncodedName();
        }

        let row_array = await this.Database.Query( statement, argument_array );

        return this.GetDecodedRowArray( row_array );
    }

    // ~~

    async InsertRow(
        row
        )
    {
        let encoded_row = this.GetEncodedRow( this.GetFullRow( row ) );
        let statement
            = "insert into "
              + this.GetEncodedName()
              + "("
              + this.GetEncodedRowColumnNameArray( encoded_row ).join( ", " )
              + ") values ("
              + this.GetEncodedRowColumnValueArray( encoded_row ).join( ", " )
              + ")";

        await this.Database.Query( statement );
    }

    // ~~

    async ReplaceRow(
        row
        )
    {
        let encoded_row = this.GetEncodedRow( this.GetFullRow( row ) );
        let statement
            = "replace into "
              + this.GetEncodedName()
              + "("
              + this.GetEncodedRowColumnNameArray( encoded_row ).join( ", " )
              + ") values ("
              + this.GetEncodedRowColumnValueArray( encoded_row ).join( ", " )
              + ")";

        await this.Database.Query( statement );
    }

    // ~~

    async UpdateRow(
        row
        )
    {
        let encoded_row = this.GetEncodedRow( row );
        let statement
            = "update "
              + this.GetEncodedName()
              + " set "
              + this.GetEncodedRowColumnAssignmentArray( encoded_row, false ).join( ", " )
              + " where"
              + this.GetEncodedRowColumnAssignmentArray( encoded_row, true ).join( ", " );

        await this.Database.Query( statement );
    }

    // ~~

    async DeleteRow(
        row
        )
    {
        let encoded_row = this.GetEncodedRow( row );
        let statement
            = "delete from "
              + this.GetEncodedName()
              + " where"
              + this.GetEncodedRowColumnAssignmentArray( encoded_row, true ).join( ", " );

        await this.Database.Query( statement );
    }

    // -- OPERATIONS

    SetColumnArray(
        column_array
        )
    {
        this.ColumnArray = column_array;

        for ( let column of column_array )
        {
            this.ColumnByNameMap.set( column.Name, column );
        }
    }

    // ~~

    SetPropertyArray(
        property_array
        )
    {
        this.PropertyArray = property_array;

        for ( let property of this.PropertyArray )
        {
            this.PropertyByNameMap.set( property.Name, property );
        }
    }
}

// ~~

export class DATABASE
{
    // -- CONSTRUCTORS

    constructor(
        name
        )
    {
        this.Name = name;
        this.TableArray = [];
        this.TableByNameMap = new Map();
        this.Driver = "";
        this.Connection = null;
    }

    // -- INQUIRIES

    GetTableByName(
        table_name
        )
    {
        let table = this.TableByNameMap.get( table_name );

        if ( table === undefined )
        {
            throw new Error( "Invalid table name : " + table_name );
        }

        return table;
    }

    // ~~

    GetPropertyArray(
        property_data_array
        )
    {
        var
            property;

        let property_array = [];

        for ( let property_data of property_data_array )
        {
            if ( typeof property_data === "string" )
            {
                property = new PROPERTY( this, property_data, true );
            }
            else if ( Array.isArray( property_data )
                      && property_data.length === 2 )
            {
                property = new PROPERTY( this, property_data[ 0 ], property_data[ 1 ] );
            }
            else
            {
                throw new Error( "Invalid property data : " + JSON.stringify( property_data ) );
            }

            property_array.push( property );
        }

        return property_array;
    }

    // ~~

    GetType(
        table,
        column,
        type_data_array
        )
    {
        var
            name;

        let sub_type_array = [];

        if ( typeof type_data_array === "string" )
        {
            name = type_data_array;
        }
        else if ( Array.isArray( type_data_array )
                  && type_data_array.length > 0 )
        {
            name = type_data_array[ 0 ];

            for ( let type_data_index = 1;
                  type_data_index < type_data_array.length;
                  ++type_data_index )
            {
                let sub_type = this.GetType( table, column, type_data_array[ type_data_index ] );
                sub_type_array.push( sub_type );
            }
        }
        else
        {
            throw new Error( "Invalid type data for column " + column.Name + " of table " + table.Name + " : " + JSON.stringify( type_data_array ) );
        }

        let type = new TYPE( this, table, column, name, sub_type_array );

        return type;
    }

    // ~~

    GetColumnArray(
        table,
        column_data_array_array
        )
    {
        let column_array = [];

        for ( let column_data_array of column_data_array_array )
        {
            if ( Array.isArray( column_data_array )
                 && column_data_array.length >= 2 )
            {
                let column = new COLUMN( this, table, column_data_array[ 0 ] );
                column.SetType( this.GetType( table, column, column_data_array[ 1 ] ) );

                if ( column_data_array.length >= 3 )
                {
                    column.SetPropertyArray( this.GetPropertyArray( column_data_array[ 2 ] ) );
                }

                if ( column_data_array.length == 4 )
                {
                    column.SetDefaultValue( column_data_array[ 3 ] );
                }

                column_array.push( column );
            }
            else
            {
                throw new Error( "Invalid column data for table " + table.Name + " : " + JSON.stringify( column_data_array ) );
            }
        }

        return column_array;
    }

    // -- OPERATIONS

    AddTable(
        name,
        column_data_array_array = [],
        property_data_array = []
        )
    {
        let table = new TABLE( this, name );
        table.SetColumnArray( this.GetColumnArray( table, column_data_array_array ) );
        table.SetPropertyArray( this.GetPropertyArray( property_data_array ) );

        this.TableArray.push( table );
        this.TableByNameMap.set( name, table );

        return table;
    }

    // ~~

    async Connect(
        host,
        user,
        password,
        driver = "mysql"
        )
    {
        this.Driver = driver;

        if ( this.Connection === null )
        {
            this.Connection
                = await mysql.createConnection(
                      {
                          host : host,
                          user : user,
                          password : password,
                          database : this.Name
                      }
                      );
        }

        return this.Connection;
    }

    // ~~

    async Query(
        statement,
        argument_array = undefined
        )
    {
        return (
            await this.Connection.query( statement, argument_array )
                .then(
                    function( [ rows, fields ] )
                    {
                        return rows;
                    }
                    )
            );
    }
}
