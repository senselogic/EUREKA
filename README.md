![](https://github.com/senselogic/EUREKA/blob/master/LOGO/eureka.png)

# Eureka

Minimalistic ORM for MySQL and PostgreSQL databases.

## Sample

```js
import { Database } from 'senselogic-eureka';
import { Mysql2Driver } from 'senselogic-eureka-mysql2';

const database = new Database( process.env.MYSQLDATABASE ?? 'eureka_project_db' );

const propertyTable
    = database.addTable(
        'PROPERTY',
        [
            [ 'id', 'TUID', [ 'key' ] ],
            [ 'number', 'FLOAT64' ],
            [ 'city', 'STRING' ],
            [ 'country', 'STRING' ],
            [ 'title', 'STRING' ],
            [ 'description', 'STRING' ],
            [ 'price', 'FLOAT64' ],
            [ 'userId', 'TUID' ],
            [ 'updateTimestamp', 'TIMESTAMP' ]
        ]
        );

const propertyImageTable
    = database.addTable(
        'PROPERTY_IMAGE',
        [
            [ 'id', 'TUID', [ 'key' ] ],
            [ 'number', 'FLOAT64' ],
            [ 'propertyId', 'TUID' ],
            [ 'filePath', 'STRING' ],
            [ 'userId', 'TUID' ],
            [ 'updateTimestamp', 'TIMESTAMP' ]
        ]
        );

const userTable
    = database.addTable(
        'USER',
        [
            [ 'id', 'TUID', [ 'key' ] ],
            [ 'firstName', 'STRING' ],
            [ 'lastName', 'STRING' ],
            [ 'email', 'STRING' ],
            [ 'passwordHash', 'STRING' ],
            [ 'updateTimestamp', 'TIMESTAMP' ]
        ]
        );

database.setDriver( new Mysql2Driver() );

await database.createConnection(
    {
        host: process.env.MYSQLHOST ?? 'localhost',
        port: process.env.MYSQLPORT ?? 3306,
        user: process.env.MYSQLUSER ?? 'root',
        password: process.env.MYSQLPASSWORD ?? ''
    }
    );

let propertyId = '4NB6wwkg6gQpZpkN1HSf7A';
let property = await propertyTable.selectRow(
    {
        where : [ [ 'id' ], '=', propertyId ]
    }
    );

let propertyImageArray = await propertyImageTable.selectRows(
    {
        where : [ [ 'propertyId' ], '=', params.propertyId ],
        order : 'number'
    }
    );

await propertyTable.updateRow(
    {
        'id' : propertyId,
        'number' : 1
    }
    );

property.id = 'BgsTcQuBCqeEZFwYLFpTKQ';
property.id = 2;
await propertyTable.insertRow( property );
```

## Version

0.1

## Author

Eric Pelzer (ecstatic.coder@gmail.com).

## License

This project is licensed under the GNU Lesser General Public License version 3.

See the [LICENSE.md](LICENSE.md) file for details.
