# Image Resizer using AWS Lambda

An AWS Lambda listen events when image created in `woobleu-dev` S3 Bucket with 'images/' as prefix of object key.  
Then, resize this image to multiple size, format and upload them back to S3

## Requirements

- [Node 16.x](https://nodejs.org/en/blog/release/v16.16.0)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html)
- AWS Lambda setup with `ACCESS_KEY_ID`, `REGION` and `SECRET_ACCESS_KEY` as its `Environment variables`.
- Proper `aws configure` settings that will allow you to connect to AWS Lambda, S3.

## Getting started

First, make sure you have all the required CLI tools installed!
Begin by installing all npm dependencies, run: `npm run clean && npm i`
Once all dependencies are installed, you can test function by running: `node index`. View the terminal to see your Lambda execution!
Finally, update `index.js` to fit your needs!

## `.env` file example

```
ACCESS_KEY_ID=FJFDJAKSDJSAKDJSDSDS
SECRET_ACCESS_KEY=SẠDNASDMNASDMNSDA
REGION=ap-southeast-1
```

## Included commands

Most of the commands have been listed in `package.json`. To run any of the the following commands type `npm run COMMAND_GOES_HERE`.
List of commands:

- `start` - run code locally with the example event
- `install` - installs all npm dependencies
- `package` - archives folder before upload to AWS Lambda
- `deploy` - deploy the function on AWS Lambda

## Deploying

In order to run the `npm run deploy` command successfully, you will need to supply the AWS credentials by running:
`aws configure`.

## Expandable

if you want to resize the image to more `format` and `size`, simply add the expected `format` or `size` to `EXPECTED_SIZES` and `EXPECTED_FORMATS` array.

```
const EXPECTED_SIZES = [1024, 768, 300];
const EXPECTED_FORMATS = ['jpeg', 'webp'];
```
