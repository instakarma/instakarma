To run the server, use:

    npm start

During development, you might prefer to run it with:

    npm run-script watch

This will restart the server any any of the scripts are changed.

The templates will always be reloaded all the time while developing. There is
no need to restart the server when changing templates.

You will need the following environment vars:

    $ export GOOGLE_CLIENT_ID="such secret!"
    $ export GOOGLE_CLIENT_SECRET="much secrecy!"

You'll also need a mongodb:

    $ mongod --dbpath db

Where db is the path to a directory to find/create your db.
