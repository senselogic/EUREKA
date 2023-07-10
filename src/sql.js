// -- FUNCTIONS

export function getSqlValueText(
    value
    )
{
    let
        sqlValueText;

    if ( Array.isArray( value )
         || typeof value === 'object' )
    {
        sqlValueText = JSON.stringify( value );
    }
    else if ( typeof value === 'string' )
    {
        sqlValueText = value;
    }
    else if ( typeof value === 'boolean' )
    {
        if ( value )
        {
            sqlValueText = 1;
        }
        else
        {
            sqlValueText = 0;
        }
    }
    else if ( typeof value === 'number' )
    {
        sqlValueText = value.toString();
    }

    return (
        '"'
        + JSON.stringify( value )
              .replaceAll( '\\', '\\\\' )
              .replaceAll( '\n', '\\n' )
              .replaceAll( '\r', '\\r' )
              .replaceAll( '\t', '\\t' )
              .replaceAll( '"', '\\"' )
              .replaceAll( '\'', '\\\'' )
        + '"'
        );
}

// ~~

export async function getSqlTableText(
    table
    )
{
    let rowArray = await table.selectRows();

    let sqlTableText
        = 'drop table if exists `' + table.database.name + '`.`' + table.name.toUpperCase() + '`;\n\n'
          + 'create table if not exists `' + table.database.name + '`.`' + table.name.toUpperCase() + '`(\n';

    let primaryKeyColumnNameArray = [];

    for ( let column of table.columnArray )
    {
        sqlTableText += '    `' + column.name + '` ' + column.getEncodedType() + ( column.isNullable ? '' : ' not' ) + ' null,\n';

        if ( column.IsKey )
        {
            primaryKeyColumnNameArray.push( '`' + column.Name + '`' );
        }
    }

    sqlTableText += '    primary key (' + primaryKeyColumnNameArray.join( ', ' ) + ')\n' +
        '    ) engine = InnoDB;\n\n';

    let sqlRowTextArray = [];

    for ( let row of rowArray )
    {
        let columnNameArray = Array.keys( row );
        let columnValueArray = Array.values( row );
        let columnValueCount = columnValueArray.length;

        let sqlRowText
            = 'replace into `' + table.database.name + '`.`' + table.name.toUpperCase() + '`\n'
              + '    (\n'
              + '        `' + columnNameArray.join( '`, `' ) + '`\n'
              + '    )\n'
              + '    values\n'
              + '    (\n';

        for ( let columnValueIndex = 0;
              columnValueIndex < columnValueCount;
              columnValueIndex++ )
        {
            let columnValue = columnValueArray[ columnValueIndex ];

            sqlRowText += '        ' + getSqlValueText( columnValue );

            if ( columnValueIndex + 1 < columnValueCount )
            {
                sqlRowText += ',\n';
            }
            else
            {
                sqlRowText += '\n';
            }
        }

        sqlRowText += '    );\n';
        sqlRowTextArray.push( sqlRowText );
    }

    sqlRowTextArray.sort();
    sqlTableText += sqlRowTextArray.join( '\n' );

    return sqlTableText;
}

// ~~

export async function getSqlDatabaseText(
    database,
    tableNameArray = undefined
    )
{
    if ( tableNameArray === undefined )
    {
        tableNameArray = [];

        for ( let table of database.tableArray )
        {
            tableNameArray.push( table.name );
        }
    }

    let sqlDatabaseText = '';

    for ( let tableName of tableNameArray )
    {
        sqlDatabaseText += await getSqlTableText( database.tableByNameMap[ tableName ] ) + '\n';
    }

    return sqlDatabaseText;
}

// ~~

export function getSqlCommandArray(
    text
    )
{
    return text.replaceAll( '\r', '' ).replace( /;\s*\n/g, ';\n' ).split( ';\n' );
}
