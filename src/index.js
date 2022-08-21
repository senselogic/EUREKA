// -- IMPORTS

import mysql from "mysql2/promise";
import {
    GetEncodedDate,
    GetEncodedDateTime,
    GetEncodedText,
    GetEncodedTime,
    GetEncodedUniversalDate,
    GetEncodedUniversalDateTime,
    GetEncodedUniversalTime,
    GetUniversalDate,
    GetUniversalDateTime,
    GetUniversalTime,
    NullUuid,
    NullTuid
    } from "senselogic-gist";

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
        this.SubTypeArray = sub_type_array;
        this.IsBoolean = ( name === "BOOL" );
        this.IsNatural = name.startsWith( "UINT" );
        this.IsInteger = name.startsWith( "INT" );
        this.IsReal = name.startsWith( "FLOAT" );
        this.IsNumeric = ( name === "NUMERIC" || this.IsBoolean || this.IsNatural || this.IsInteger || this.IsReal );
        this.IsTuid = ( name === "TUID" );
        this.IsUuid = ( name === "UUID" );
        this.IsDate = ( name === "DATE" );
        this.IsTime = ( name === "TIME" );
        this.IsDateTime = ( name === "DATETIME" );
        this.IsString = ( name.startsWith( "STRING" ) || this.IsTuid || this.Uuid || this.IsDate || this.IsDateTime );
        this.IsList = ( name === "LIST" );
        this.IsMap = ( name === "MAP" );
        this.IsObject = ( name === "OBJECT" );
        this.IsJson = ( name === "JSON" || name === this.IsList || this.IsMap || this.IsObject );
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
        else if ( this.IsTuid )
        {
            return NullTuid;
        }
        else if ( this.IsUuid )
        {
            return NullUuid;
        }
        else if ( this.IsDate )
        {
            return GetEncodedDate( GetUniversalDate() );
        }
        else if ( this.IsTime )
        {
            return GetEncodedTime( GetUniversalTime() );
        }
        else if ( this.IsDateTime )
        {
            return GetEncodedDateTime( GetUniversalDateTime() );
        }
        else if ( this.IsList )
        {
            return [];
        }
        else if ( this.IsJson )
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
        this.DefaultValue = undefined;
        this.PropertyArray = [];
        this.PropertyByNameMap = new Map();
        this.IsKey = false;
    }

    // -- INQUIRIES

    GetDefaultValue(
        )
    {
        if ( this.DefaultValue !== undefined )
        {
            return this.DefaultValue;
        }
        else
        {
            return this.Type.GetDefaultValue();
        }
    }

    // ~~

    HasProperty(
        property_name
        )
    {
        return this.PropertyByNameMap.has( property_name );
    }

    // ~~

    GetPropertyValue(
        property_name,
        default_property_value
        )
    {
        let property_value = this.PropertyByNameMap.get( property_name );

        if ( property_value !== undefined )
        {
            return property_value;
        }
        else
        {
            return default_property_value;
        }
    }

    // ~~

    GetEncodedName(
        )
    {
        return "`" + this.Name + "`";
    }

    // ~~

    GetEncodedType(
        )
    {
        switch ( this.Type.Name )
        {
            case "BOOL" : return "TINYINT UNSIGNED";
            case "INT8" : return "TINYINT";
            case "UINT8" : return "TINYINT UNSIGNED";
            case "INT16" : return "SMALLINT";
            case "UINT16" : return "SMALLINT UNSIGNED";
            case "INT32" : return "INT";
            case "UINT32" : return "INT UNSIGNED";
            case "INT64" : return "BIGINT";
            case "UINT64" : return "BIGINT UNSIGNED";
            case "FLOAT32" : return "FLOAT";
            case "FLOAT64" : return "DOUBLE";
            case "STRING8" : return "TINYTEXT";
            case "STRING16" : return "TEXT";
            case "STRING24" : return "MEDIUMTEXT";
            case "STRING32" : return "LONGTEXT";
            case "STRING" :
            {
                if ( this.HasProperty( "capacity" ) )
                {
                    return "VARCHAR( " + this.GetPropertyValue( "capacity" ) + " )";
                }
                else
                {
                    return "TEXT";
                }
            }
            case "DATE" : return "DATE";
            case "TIME" : return "TIME";
            case "DATETIME" : return "DATETIME";
            case "TUID" : return "VARCHAR( 22 )";
            case "UUID" : return "VARCHAR( 36 )";
            case "BLOB" : return "BLOB";
            default : return "TEXT";
        }
    }

    // ~~

    GetEncodedDeclaration(
        )
    {
        let encoded_declaration
            = this.GetEncodedName()
              + " "
              + this.GetEncodedType();

        if ( this.HasProperty( "null" ) )
        {
            if ( this.GetPropertyValue( "null" ) )
            {
                encoded_declaration += " null";
            }
            else
            {
                encoded_declaration += " not null";
            }
        }

        if ( this.GetPropertyValue( "incremented", false ) )
        {
            encoded_declaration += " auto_increment";
        }

        return encoded_declaration;
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
        else if ( this.Type.IsJson )
        {
             return GetEncodedText( JSON.stringify( value ) );
        }
        else
        {
            return GetEncodedText( value );
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
        else if ( this.Type.IsDate )
        {
            return GetEncodedDate( GetUniversalDate( value ) );
        }
        else if ( this.Type.IsTime )
        {
            return GetEncodedTime( GetUniversalTime( value ) );
        }
        else if ( this.Type.IsDateTime )
        {
            return GetEncodedDateTime( GetUniversalDateTime( value ) );
        }
        else if ( this.Type.IsJson )
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

    GetFilledRow(
        row
        )
    {
        let filled_row = {};

        for ( let column of this.ColumnArray )
        {
            if ( row.hasOwnProperty( column.Name )
                 && row[ column.Name ] !== undefined )
            {
                filled_row[ column.Name ] = row[ column.Name ];
            }
            else
            {
                filled_row[ column.Name ] = column.GetDefaultValue();
            }
        }

        return filled_row;
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

    GetEncodedColumnDeclarationArray(
        )
    {
        let encoded_column_declaration_array = [];

        for ( let column of this.ColumnArray )
        {
            encoded_column_declaration_array.push( column.GetEncodedDeclaration() );
        }

        return encoded_column_declaration_array;
    }

    // ~~

    GetEncodedColumnNameArray(
        column_name_array
        )
    {
        let encoded_column_name_array = [];

        for ( let column_name of column_name_array )
        {
            encoded_column_name_array.push( "`" + column_name + "`" );
        }

        return encoded_column_name_array;
    }

    // ~~

    GetEncodedSortingColumnName(
        sorting_column_name
        )
    {
        switch ( sorting_column_name.substring( 0, 1 ) )
        {
            case "+" :
            {
                return "`" + sorting_column_name.substring( 1 ) + "` asc";
            }

            case "-" :
            {
                return "`" + sorting_column_name.substring( 1 ) + "` desc";
            }

            default :
            {
                return "`" + sorting_column_name + "` asc";
            }
        }
    }

    // ~~

    GetEncodedSortingColumnNameArray(
        sorting_column_name_array
        )
    {
        let encoded_sorting_column_name_array = [];

        for ( let dorting_column_name of sorting_column_name_array )
        {
            encoded_sorting_column_name_array.push( this.GetEncodedSortingColumnName( dorting_column_name ) );
        }

        return encoded_sorting_column_name_array;
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

    GetEncodedConditionValue(
        condition_value
        )
    {
        if ( typeof condition_value === "number" )
        {
            return condition_value;
        }
        else if ( typeof condition_value === "string" )
        {
            return GetEncodedText( condition_value );
        }
        else
        {
            throw Error( "Invalid condition value : " + condition_value );
        }
    }

    // ~~

    GetEncodedConditionExpression(
        condition_expression
        )
    {
        if ( typeof condition_expression === "string" )
        {
            return condition_expression;
        }
        else if ( Array.isArray( condition_expression ) )
        {
            if ( condition_expression.length === 3 )
            {
                if ( typeof condition_expression[ 0 ] === "string"
                     && typeof condition_expression[ 1 ] === "string" )
                {
                    return (
                        "`"
                        + condition_expression[ 0 ]
                        + "` "
                        + condition_expression[ 1 ]
                        + " "
                        + this.GetEncodedConditionValue( condition_expression[ 2 ] )
                        );
                }
            }
        }
    }

    // ~~

    async Create(
        )
    {
        let statement
            = "create table if not exists "
              + this.GetEncodedName()
              + "( "
              + this.GetEncodedColumnDeclarationArray().join( ", " );

        for ( let column of this.ColumnArray )
        {
            if ( column.IsKey )
            {
                statement += ", primary key(`" + column.Name + "`)";
            }
        }

        statement += " )";

        await this.Database.Query( statement );
    }

    // ~~

    async Drop(
        )
    {
        let statement
            = "drop table if exists "
              + this.GetEncodedName();

        await this.Database.Query( statement );
    }

    // ~~

    async QueryRows(
        statement,
        argument_array = undefined
        )
    {
        let row_array = await this.Database.Query( statement, argument_array );

        return this.GetDecodedRowArray( row_array );
    }

    // ~~

    async SelectRows(
        column_name_array = undefined,
        condition_expression = undefined,
        argument_array = undefined,
        sorting_column_name_array = undefined,
        maximum_row_count = undefined
        )
    {
        let statement = "select ";

        if ( column_name_array !== undefined )
        {
            if ( Array.isArray( column_name_array ) )
            {
                statement += this.GetEncodedColumnNameArray( column_name_array ).join( ", " );
            }
            else
            {
                statement += column_name_array;
            }
        }
        else
        {
            statement += "*";
        }

        statement += " from " + this.GetEncodedName();

        if ( condition_expression !== undefined )
        {
            statement += " where " + this.GetEncodedConditionExpression( condition_expression );
        }

        if ( sorting_column_name_array !== undefined )
        {
            if ( Array.isArray( sorting_column_name_array ) )
            {
                statement += " order by " + this.GetEncodedSortingColumnNameArray( sorting_column_name_array ).join( ", " );
            }
            else
            {
                statement += " order by " + this.GetEncodedSortingColumnName( sorting_column_name_array );
            }
        }

        if ( maximum_row_count !== undefined )
        {
            statement += " limit " + maximum_row_count;
        }

        let row_array = await this.Database.Query( statement, argument_array );

        return this.GetDecodedRowArray( row_array );
    }

    // ~~

    async SelectRow(
        column_name_array = undefined,
        condition_expression = undefined,
        argument_array = undefined
        )
    {
        let row_array = await this.SelectRows( column_name_array, condition_expression, argument_array, undefined, 1 );

        return row_array[ 0 ];
    }

    // ~~

    async HasRow(
        column_name_array = undefined,
        condition_expression = undefined,
        argument_array = undefined
        )
    {
        let row_array = await this.SelectRows( column_name_array, condition_expression, argument_array, undefined, 1 );

        return row_array.length > 0;
    }

    // ~~

    async InsertRow(
        row
        )
    {
        let filled_row = this.GetFilledRow( row );
        let encoded_row = this.GetEncodedRow( filled_row );
        let statement
            = "insert into "
              + this.GetEncodedName()
              + "( "
              + this.GetEncodedRowColumnNameArray( encoded_row ).join( ", " )
              + " ) values ( "
              + this.GetEncodedRowColumnValueArray( encoded_row ).join( ", " )
              + " )";

        await this.Database.Query( statement );

        return filled_row;
    }

    // ~~

    async ReplaceRow(
        row
        )
    {
        let filled_row = this.GetFilledRow( row );
        let encoded_row = this.GetEncodedRow( filled_row );
        let statement
            = "replace into "
              + this.GetEncodedName()
              + "( "
              + this.GetEncodedRowColumnNameArray( encoded_row ).join( ", " )
              + " ) values ( "
              + this.GetEncodedRowColumnValueArray( encoded_row ).join( ", " )
              + " )";

        await this.Database.Query( statement );

        return filled_row;
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
                if ( property_data.startsWith( "!" ) )
                {
                    property = new PROPERTY( this, property_data.substring( 1 ), false );
                }
                else
                {
                    property = new PROPERTY( this, property_data, true );
                }
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
