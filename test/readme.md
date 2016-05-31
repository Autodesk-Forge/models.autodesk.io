# models.autodesk.io test suite

The tests have been designed to run locally and via a service like [Travis CI](https://travis-ci.org/).


### Setup
When you test locally or on the Travis site, there is no addional settings required.

When you run locally, make sure to execute 'npm install --dev' as well. This command will download and install the
required node modules for developers automatically for you.

These modules are only required for the tests to run on your local machine.

```
npm install --dev
```

### Run the test
On [Travis CI](https://travis-ci.org/), it is launched automatically.

On your local machine, run the following command:

```
npm test
```
