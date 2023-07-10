// -- IMPORTS

import { getTuidFromText, getUuidFromText, replacePrefix } from 'senselogic-gist';

// -- FUNCTIONS

export function getBasilValueText(
    value
    )
{
    if ( Array.isArray( value ) )
    {
        if ( value.length === 0 )
        {
            return "{}";
        }
        else
        {
            let valueTextArray = [];

            for ( let element of value )
            {
                valueTextArray.push( getBasilValueText( element ) );
            }

            return "{ " + valueTextArray.join( " ~ " ) + " }";
        }
    }
    else if ( typeof value === 'object' )
    {
        let keyArray = Object.keys( value );

        if ( keyArray.length === 0 )
        {
            return "{}";
        }
        else
        {
            let valueTextArray = [];

            for ( let key of keyArray )
            {
                valueTextArray.push( "{ " + getBasilValueText( key ) + " ~ " + getBasilValueText( value[ key ] ) + " }" );
            }

            return "{ " + valueTextArray.join( " ~ " ) + " }";
        }
    }
    else if ( typeof value === 'string' )
    {
        let valueText
            = value
                  .replaceAll( '\\', '\\\\' )
                  .replaceAll( '~', '\\~' )
                  .replaceAll( '{', '\\{' )
                  .replaceAll( '}', '\\}' )
                  .replaceAll( '\n', '\\n' )
                  .replaceAll( '\r', '\\r' )
                  .replaceAll( '\t', '\\t' );

        valueText = replacePrefix( valueText, '#', '\\#' );
        valueText = replacePrefix( valueText, '%', '\\%' );
        valueText = replacePrefix( valueText, ' ', '^' );
        valueText = replacePrefix( valueText, ' $', '^' );

        return valueText;
    }
    else
    {
        return value;
    }
}

// ~~

export async function getBasilTableText(
    table,
    oldIdArray,
    newIdArray
    )
{
    let rowArray = await table.selectRows();

    let basilTableText = "";
    let basilRowTextArray = [];

    for ( let row of rowArray )
    {
        let columnNameArray = Object.keys( row );
        let columnValueArray = Object.values( row );
        let columnValueCount = columnValueArray.length;

        if ( basilTableText === "" )
        {
            basilTableText =
                table.name.toUpperCase() + "\n\n"
                + "    " + columnNameArray.join( " " ) + "\n\n";
        }

        let basilRowText = "";
        let idValue = "";
        let idValueCharacterCount = 0;

        for ( let columnValueIndex = 0;
              columnValueIndex < columnValueCount;
              columnValueIndex++ )
        {
            if ( basilRowText === "" )
            {
                basilRowText += "        ";
            }
            else
            {
                basilRowText += "            ~ ";
            }

            let columnName = columnNameArray[ columnValueIndex ];
            let columnValue = columnValueArray[ columnValueIndex ];

            basilRowText += getBasilValueText( columnValue ) + "\n";

            if ( table.name === "text" &&
                 columnValueIndex === 0 &&
                 columnName.toLowerCase() === "id"
            )
            {
                idValueCharacterCount = columnValue.length;

                if ( idValueCharacterCount === 22
                     || idValueCharacterCount === 36 )
                {
                    idValue = columnValue;
                }
                else
                {
                    idValueCharacterCount = 0;
                }
            }
            else if ( idValueCharacterCount !== 0
                      && ( columnName.toLowerCase() === "slug"
                           || columnName.toLowerCase() === "code" ) )
            {
                let slugArray =
                    [
                        columnValue,
                        columnValue + "-" + table.name.toLowerCase().replaceAll( "_", "-" )
                    ];

                for ( let slug of slugArray )
                {
                    let
                        oldId,
                        newId;

                    if ( idValueCharacterCount === 22 )
                    {
                        oldId = getTuidFromText( slug );
                        newId = "%" + slug;
                    }
                    else if ( idValueCharacterCount === 36 )
                    {
                        oldId = getUuidFromText( slug );
                        newId = "#" + slug;
                    }

                    if ( oldId === idValue )
                    {
                        oldIdArray.push( oldId );
                        newIdArray.push( newId );
                    }
                }
            }
        }

        basilRowTextArray.push( basilRowText );
    }

    basilRowTextArray.sort();

    basilTableText += basilRowTextArray.join( "\n" );

    return basilTableText;
}

// ~~

export async function getBasilDatabaseText(
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

    let oldIdArray = [];
    let newIdArray = [];
    let basilDatabaseText = "";

    for ( let tableName of tableNameArray )
    {
        basilDatabaseText
            += await getBasilTableText( database.tableByNameMap[ tableName ], oldIdArray, newIdArray ) + "\n";
    }

    for ( let i = 0; i < oldIdArray.length; i++ )
    {
        basilDatabaseText = basilDatabaseText.replaceAll(
            oldIdArray[ i ],
            newIdArray[ i ]
        );
    }

    return basilDatabaseText;
}
